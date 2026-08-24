import { createHash } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { extractConfig, generateWithLabels } from './utils.ts';
import { setSeed } from './random.ts';
import {
    CompetencyTarget,
    ProblemGenerator,
    ProblemStub,
    ResolvedProblemStub,
    AbstractProblem,
    RenderPayload
} from '../types/ml-engine.ts';
import { ConfigFromSchema, ConfigSchema, ResolvedConfig } from '../types/schema.ts';
import type {WorkCounters} from './work-counters.ts';
import {radixSortUtf8} from './content-identity.ts';
import {loadTargets} from './spec-catalog.ts';
import {
    clearModelCatalogCaches,
    loadGeneratorModelCatalog,
    loadViewModelCatalog,
    type GeneratorModelDescriptor,
    type ViewModelDescriptor
} from './model-catalog.ts';
import {
    matchTargets,
    type MatchTuple
} from './matching.ts';
export * from './matching.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Sample identity
//
// Every dataset sample is identified by the structural tuple
// (targetId, generatorId, viewId, split, mode, instanceIdx). The seed, the
// filename, the cache identity and all reporting derive from this tuple, so
// a code change only invalidates the samples whose tuple inputs it touches.
// ---------------------------------------------------------------------------

export type SampleSplit = 'train' | 'val';
export type SampleMode = 'question' | 'solution';

/**
 * On-disk folder of each split, under a dataset's root. The split is part of
 * sample identity but is not encoded in the filename — it *is* the parent
 * directory — so every reader and writer of dataset images resolves paths
 * through this map.
 */
export const SPLIT_DIRS: Record<SampleSplit, string> = { train: 'train', val: 'validation' };

export interface SampleIdentity {
    targetId: string;
    generatorId: string;
    viewId: string;
    split: SampleSplit;
    mode: SampleMode;
    instanceIdx: number;
}

const KEY_SEPARATOR = '#';
const MODE_CODES: Record<SampleMode, string> = { question: 'Q', solution: 'S' };

export function computeSampleKey(identity: SampleIdentity): string {
    const { targetId, generatorId, viewId, split, mode, instanceIdx } = identity;
    for (const part of [targetId, generatorId, viewId]) {
        if (!part || part.includes(KEY_SEPARATOR)) {
            throw new Error(`Invalid sample key part: "${part}" (must be non-empty and must not contain "${KEY_SEPARATOR}")`);
        }
    }
    if (!Number.isInteger(instanceIdx) || instanceIdx < 0) {
        throw new Error(`Invalid instanceIdx: ${instanceIdx} (must be a non-negative integer)`);
    }
    return [targetId, generatorId, viewId, split, mode, `inst:${instanceIdx}`].join(KEY_SEPARATOR);
}

export function parseSampleKey(sampleKey: string): SampleIdentity {
    const parts = sampleKey.split(KEY_SEPARATOR);
    if (parts.length !== 6 || !parts[5].startsWith('inst:')) {
        throw new Error(`Malformed sample key: "${sampleKey}"`);
    }
    const [targetId, generatorId, viewId, split, mode] = parts;
    const instanceIdx = Number(parts[5].slice('inst:'.length));
    if (split !== 'train' && split !== 'val') {
        throw new Error(`Malformed sample key (unknown split "${split}"): "${sampleKey}"`);
    }
    if (mode !== 'question' && mode !== 'solution') {
        throw new Error(`Malformed sample key (unknown mode "${mode}"): "${sampleKey}"`);
    }
    if (!Number.isInteger(instanceIdx) || instanceIdx < 0) {
        throw new Error(`Malformed sample key (bad instance "${parts[5]}"): "${sampleKey}"`);
    }
    return { targetId, generatorId, viewId, split, mode, instanceIdx };
}

function fnv1a(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
}

/** Derives the deterministic PRNG seed for one draw of a sample. */
export function computeSampleSeed(sampleKey: string, attempt: number): number {
    return fnv1a(`${sampleKey}${KEY_SEPARATOR}att:${attempt}`) % 2147483647;
}

export function sanitizeFilePart(part: string): string {
    return part.replace(/[^a-zA-Z0-9-]/g, '-');
}

/**
 * Stable, unique-by-construction image filename. The split is not encoded
 * because it is already the parent directory of the module output folder.
 */
export function computeSampleFilename(identity: SampleIdentity): string {
    const { targetId, generatorId, viewId, mode, instanceIdx } = identity;
    return `${sanitizeFilePart(targetId)}_${sanitizeFilePart(generatorId)}_${sanitizeFilePart(viewId)}`
        + `_inst-${instanceIdx}_mode-${MODE_CODES[mode]}.png`;
}

// ---------------------------------------------------------------------------
// Catalog loading
// ---------------------------------------------------------------------------

export interface GeneratorCatalogEntry extends GeneratorModelDescriptor {
    generator: ProblemGenerator;
}

export type ViewCatalogEntry = ViewModelDescriptor;

/**
 * Returns generator IDs that have no semantically compatible target/view path
 * capable of producing a sample. Used to keep the isolated test spec useful as
 * a smoke and regression surface for every generator module.
 */
export function findGeneratorsWithoutTestPath(
    targets: CompetencyTarget[],
    generatorCatalog: GeneratorCatalogEntry[],
    viewCatalog: ViewCatalogEntry[],
    maxAttempts = 10
): string[] {
    const { tuples } = matchTargets(targets, generatorCatalog, viewCatalog);
    const tuplesByGenerator = new Map<string, MatchTuple[]>();
    for (const tuple of tuples) {
        const group = tuplesByGenerator.get(tuple.generatorId);
        if (group) group.push(tuple);
        else tuplesByGenerator.set(tuple.generatorId, [tuple]);
    }

    const uncovered = generatorCatalog
        .filter(entry => {
            const candidates = tuplesByGenerator.get(entry.generatorId) ?? [];
            return !candidates.some(tuple => {
                const sampleKey = computeSampleKey({
                    targetId: tuple.target.id,
                    generatorId: tuple.generatorId,
                    viewId: tuple.viewId,
                    split: 'train',
                    mode: 'question',
                    instanceIdx: 0
                });
                try {
                    return generateSampleWithRetry({
                        generator: entry.generator,
                        labels: [...tuple.target.labels],
                        sampleKey,
                        maxAttempts
                    }).stub !== null;
                } catch {
                    return false;
                }
            });
        })
        .map(entry => entry.generatorId);
    return radixSortUtf8(uncovered);
}

function camelCase(str: string): string {
    return str.replace(/-([a-z0-9])/g, g => g[1].toUpperCase());
}

const generatorCatalogCache = new Map<string, readonly GeneratorCatalogEntry[]>();

export async function loadGeneratorCatalog(
    generatorsRoot: string = resolve(PROJECT_ROOT, 'src', 'generators'),
    counters?: WorkCounters,
    entryFiles?: ReadonlyMap<string, string>
): Promise<GeneratorCatalogEntry[]> {
    const catalogKey = resolve(generatorsRoot);
    const cached = entryFiles ? undefined : generatorCatalogCache.get(catalogKey);
    if (cached) {
        counters?.add('catalog.generator_cache_hits');
        return [...cached];
    }
    const descriptors = await loadGeneratorModelCatalog(generatorsRoot, counters, entryFiles);
    const entries: GeneratorCatalogEntry[] = [];
    for (const descriptor of descriptors) {
        try {
            const id = descriptor.generatorId;
            const className = camelCase(id[0].toUpperCase() + id.slice(1)) + 'Generator';
            const generatorModule = await import(pathToFileURL(
                resolve(descriptor.module.absolutePath, 'generator.ts')
            ).href);
            const GeneratorClass = generatorModule[className];
            if (!GeneratorClass) {
                console.warn(`Generator class ${className} not found in ${id}, skipping.`);
                continue;
            }
            const generator: ProblemGenerator = new GeneratorClass();
            entries.push({...descriptor, generator});
        } catch (e) {
            console.warn(`Could not load generator module ${descriptor.generatorId}:`, e);
        }
    }
    if (!entryFiles) generatorCatalogCache.set(catalogKey, entries);
    return [...entries];
}

export async function loadViewCatalog(
    viewsRoot: string = resolve(PROJECT_ROOT, 'src', 'visuals', 'views'),
    counters?: WorkCounters,
    entryFiles?: ReadonlyMap<string, string>
): Promise<ViewCatalogEntry[]> {
    return loadViewModelCatalog(viewsRoot, counters, entryFiles);
}

/** Clears process-local catalog state for watch-mode invalidation and isolated tests. */
export function clearGenerationCatalogCaches(): void {
    generatorCatalogCache.clear();
    clearModelCatalogCaches();
}

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

export interface GenerateSampleInput {
    generator: ProblemGenerator;
    labels: string[];
    seed: number;
}

/**
 * Pure generation primitive: one exact deterministic draw. Takes only what
 * generation consumes — the view participates solely through the seed
 * (derived from a sample key that contains the viewId).
 */
export function generateSample({ generator, labels, seed }: GenerateSampleInput): ResolvedProblemStub | null {
    setSeed(seed);
    return generateWithLabels(generator, labels);
}

export interface GenerateSampleWithRetryInput {
    generator: ProblemGenerator;
    labels: string[];
    sampleKey: string;
    maxAttempts?: number;
    /** Caller-defined dedup scope; return true to reject a draw and retry */
    isDuplicate?: (stub: ResolvedProblemStub, attempt: { attempt: number; seed: number }) => boolean;
}

export interface RetryResult {
    stub: ResolvedProblemStub | null;
    /** The winning attempt (or maxAttempts when stub is null) — record it: it is a seed input */
    attempt: number;
    /** The seed of the winning attempt */
    seed: number;
}

export function generateSampleWithRetry({
    generator,
    labels,
    sampleKey,
    maxAttempts = 50,
    isDuplicate
}: GenerateSampleWithRetryInput): RetryResult {
    let attempt = 0;
    let seed = 0;
    while (attempt < maxAttempts) {
        attempt++;
        seed = computeSampleSeed(sampleKey, attempt);
        const stub = generateSample({ generator, labels, seed });
        if (!stub) continue;
        if (isDuplicate && isDuplicate(stub, { attempt, seed })) continue;
        return { stub, attempt, seed };
    }
    return { stub: null, attempt, seed };
}

export interface GenerateSampleByKeyInput {
    sampleKey: string;
    attempt: number;
    specName: string;
    specRoot?: string;
    generatorsRoot?: string;
}

export interface GenerateSampleByKeyResult {
    identity: SampleIdentity;
    target: CompetencyTarget;
    labels: string[];
    seed: number;
    stub: ResolvedProblemStub | null;
}

/**
 * Replays one exact draw from its sample key alone. Resolves the target from
 * the spec module and the generator from the catalog, so a sample recorded in
 * metadata can be reproduced without re-running the pipeline.
 */
export async function generateSampleByKey({
    sampleKey,
    attempt,
    specName,
    specRoot,
    generatorsRoot
}: GenerateSampleByKeyInput): Promise<GenerateSampleByKeyResult> {
    const identity = parseSampleKey(sampleKey);

    const targets = await loadTargets(specName, specRoot);
    const target = targets.find(t => t.id === identity.targetId);
    if (!target) {
        throw new Error(`Target "${identity.targetId}" not found in spec module "${specName}"`);
    }

    const generatorCatalog = await loadGeneratorCatalog(generatorsRoot);
    const entry = generatorCatalog.find(g => g.generatorId === identity.generatorId);
    if (!entry) {
        throw new Error(`Generator "${identity.generatorId}" from sample key not found in catalog`);
    }

    const labels = [...target.labels];
    const seed = computeSampleSeed(sampleKey, attempt);
    const stub = generateSample({ generator: entry.generator, labels, seed });
    return { identity, target, labels, seed, stub };
}

export interface TargetSample {
    identity: SampleIdentity;
    sampleKey: string;
    fileName: string;
    seed: number;
    attempt: number;
    stub: ResolvedProblemStub | null;
    fingerprint: string | null;
    /** Set when the generator threw for this tuple (e.g. a config validation error) — a matching problem worth surfacing, not a crash */
    error: string | null;
}

export interface GenerateTargetSamplesOptions {
    instancesPerTuple?: number;
    valRatio?: number;
    maxAttempts?: number;
}

/**
 * Generates every sample belonging to one target across all matching
 * (generator, view) tuples: question and solution modes, all instances, and
 * the val split for each val-allocated tuple. No cross-target dedup is
 * applied, so a sample's attempt here can differ from the pipeline's when the
 * pipeline retried due to a content collision with another target — comparing
 * the two attempts is itself a useful diagnostic.
 */
export function generateTargetSamples(
    target: CompetencyTarget,
    generatorCatalog: GeneratorCatalogEntry[],
    viewCatalog: ViewCatalogEntry[],
    options: GenerateTargetSamplesOptions = {}
): TargetSample[] {
    const { instancesPerTuple = 1, valRatio = DEFAULT_VAL_RATIO, maxAttempts = 50 } = options;
    const { tuples } = matchTargets([target], generatorCatalog, viewCatalog);
    const modes: SampleMode[] = ['question', 'solution'];
    const generatorsById = new Map(generatorCatalog.map(entry => [entry.generatorId, entry.generator]));

    const samples: TargetSample[] = [];
    for (const tuple of tuples) {
        const generator = generatorsById.get(tuple.generatorId)!;
        const splits: SampleSplit[] = isValTuple(target.id, tuple.generatorId, tuple.viewId, valRatio)
            ? ['train', 'val']
            : ['train'];
        for (const split of splits) {
            for (let instanceIdx = 0; instanceIdx < instancesPerTuple; instanceIdx++) {
                for (const mode of modes) {
                    const identity: SampleIdentity = {
                        targetId: target.id,
                        generatorId: tuple.generatorId,
                        viewId: tuple.viewId,
                        split,
                        mode,
                        instanceIdx
                    };
                    const sampleKey = computeSampleKey(identity);
                    let stub: ResolvedProblemStub | null = null;
                    let attempt = 0;
                    let seed = computeSampleSeed(sampleKey, 1);
                    let error: string | null = null;
                    try {
                        ({ stub, attempt, seed } = generateSampleWithRetry({
                            generator,
                            labels: [...target.labels],
                            sampleKey,
                            maxAttempts
                        }));
                    } catch (e) {
                        error = e instanceof Error ? e.message : String(e);
                    }
                    samples.push({
                        identity,
                        sampleKey,
                        fileName: computeSampleFilename(identity),
                        seed,
                        attempt,
                        stub,
                        fingerprint: stub ? computeContentFingerprint(stub.data) : null,
                        error
                    });
                }
            }
        }
    }
    return samples;
}

// ---------------------------------------------------------------------------
// Supporting utilities
// ---------------------------------------------------------------------------

function canonicalJson(value: any): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value) ?? 'null';
    }
    if (Array.isArray(value)) {
        return '[' + value.map(v => canonicalJson(v)).join(',') + ']';
    }
    const keys = radixSortUtf8(Object.keys(value).filter(k => value[k] !== undefined));
    return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',') + '}';
}

/**
 * Order-independent hash of a problem's data, used to detect duplicate
 * content instead of relying on generator-authored stub id strings.
 */
export function computeContentFingerprint(data: any): string {
    return createHash('sha256').update(canonicalJson(data)).digest('hex').slice(0, 16);
}

/** Resolves the same seeded view configuration and capability labels that `withConfig` will render. */
export function resolveViewConfigWithLabels<T extends ConfigSchema>(
    schema: T,
    labels: string[],
    seed: number
): ResolvedConfig<ConfigFromSchema<T>> {
    setSeed(seed);
    return extractConfig(schema, labels);
}

/** Convenience projection for callers concerned only with configured task identity. */
export function resolveViewConfig<T extends ConfigSchema>(
    schema: T,
    labels: string[],
    seed: number
): ConfigFromSchema<T> {
    return resolveViewConfigWithLabels(schema, labels, seed).config;
}

/**
 * Identity of a rendered task within one view. The mathematical payload alone
 * is insufficient: one view can turn it into distinct tasks through its
 * resolved configuration (for example, which quantity is left unknown).
 */
export function computeTaskFingerprint(data: any, viewConfig: Record<string, unknown>): string {
    return computeContentFingerprint({ data, viewConfig });
}

/** Share of matched tuples allocated to the validation split. */
export const DEFAULT_VAL_RATIO = 0.25;

/**
 * Deterministic, order-independent val-split allocation, decided per matched
 * (target, generator, view) tuple — the unit the pipeline generates an
 * exercise for.
 *
 * Allocation is per tuple rather than per target because targets differ by an
 * order of magnitude in how many tuples they match: allocating whole targets
 * made the realized split both far smaller than the requested ratio and wildly
 * uneven across views, leaving most views with no validation samples at all.
 * Per-tuple allocation gives every view val coverage proportional to its train
 * mass.
 *
 * Salted so it does not correlate with sample seeds, and a pure function of the
 * tuple, so membership survives unrelated reorderings of specs or catalogs.
 */
export function isValTuple(targetId: string, generatorId: string, viewId: string, ratio: number): boolean {
    if (ratio <= 0) return false;
    if (ratio >= 1) return true;
    const tupleKey = ['val-split', targetId, generatorId, viewId].join(KEY_SEPARATOR);
    return fnv1a(tupleKey) % 10000 < ratio * 10000;
}

export interface BuildProblemInput {
    stub: ProblemStub;
    type: AbstractProblem['type'];
    labels: string[];
}

/**
 * Wraps generated canonical data and orchestration-resolved labels into the
 * AbstractProblem sent to the renderer.
 */
export function buildProblem({ stub, type, labels }: BuildProblemInput): AbstractProblem {
    return {
        type,
        data: stub.data,
        labels: Array.from(new Set([
            ...labels,
            ...('labels' in stub && Array.isArray(stub.labels) ? stub.labels : [])
        ]))
    };
}

export interface BuildRenderPayloadInput {
    problem: AbstractProblem;
    viewId: string;
    labels: string[];
    mode: SampleMode;
    seed: number;
}

/** Single constructor for the payload contract, including the render seed. */
export function buildRenderPayload({ problem, viewId, labels, mode, seed }: BuildRenderPayloadInput): RenderPayload {
    return {
        problem,
        viewId,
        labels,
        isSolutionView: mode === 'solution',
        seed
    };
}
