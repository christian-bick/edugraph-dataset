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
import type {GenerationPlan} from '../types/compatibility.ts';
import type {GenerationReplay, PreparedViewConfiguration} from '../types/generation-plan.ts';
import {generatePlannedDraw, type PlannedGenerationDraw} from './planned-generation.ts';
import {CompatibilityContractError, validateGenerationPlan} from './compatibility.ts';
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
    maxAttempts = 10,
    matchedTuples?: MatchTuple[]
): string[] {
    const tuples = matchedTuples ?? matchTargets(targets, generatorCatalog, viewCatalog).tuples;
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
                    const view = viewCatalog.find(view => view.viewId === tuple.viewId)!;
                    return generatePlannedSampleWithRetry({
                        generator: entry.generator,
                        viewSchema: view.schema,
                        plan: tuple.plan,
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
 * Standalone generator-test primitive, without a matched view contract.
 * Routed production and debugging must use generatePlannedSampleWithRetry or
 * generateSampleByKey so both role selections stay inside the matched plan.
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

/** Standalone generator-test retry helper; never use for a routed generator/view pair. */
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

export interface PlannedRetryResult extends PlannedGenerationDraw {
    attempt: number;
    seed: number;
}

/** Mathematical retries may change the draw, but every draw remains inside the matched plan. */
export function generatePlannedSampleWithRetry(input: {
    generator: ProblemGenerator;
    viewSchema: ConfigSchema;
    plan: GenerationPlan;
    sampleKey: string;
    maxAttempts?: number;
    isDuplicate?: (draw: PlannedGenerationDraw) => boolean;
}): PlannedRetryResult {
    const maxAttempts = input.maxAttempts ?? 50;
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
        throw new CompatibilityContractError('maxAttempts must be a positive safe integer.');
    }
    let last: PlannedGenerationDraw | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const seed = computeSampleSeed(input.sampleKey, attempt);
        const draw = generatePlannedDraw({...input, seed, attempt});
        last = draw;
        if (draw.stub && !input.isDuplicate?.(draw)) return {...draw, attempt, seed};
    }
    return {...last!, stub: null, attempt: maxAttempts, seed: last!.replay.seed};
}

export interface GenerateSampleByKeyInput {
    sampleKey: string;
    attempt: number;
    specName: string;
    specRoot?: string;
    generatorsRoot?: string;
    viewsRoot?: string;
    /** Required to reproduce an artifact's actual draw, including solution reuse. */
    replay?: GenerationReplay;
    recordedPlan?: GenerationPlan;
}

export interface GenerateSampleByKeyResult {
    identity: SampleIdentity;
    target: CompetencyTarget;
    targetLabels: string[];
    seed: number;
    stub: ResolvedProblemStub | null;
    plan: GenerationPlan;
    preparedView: PreparedViewConfiguration;
    replay: GenerationReplay;
    labels: string[];
}

/**
 * Resolves a current plan and reproduces a recorded draw, including question
 * reuse by a solution. Without a recorded recipe, requests a fresh draw at the
 * explicit attempt; a sample key alone does not identify prior retry choices.
 */
export async function generateSampleByKey({
    sampleKey,
    attempt,
    specName,
    specRoot,
    generatorsRoot,
    viewsRoot,
    replay,
    recordedPlan
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

    const targetLabels = [...target.labels];
    const viewCatalog = await loadViewCatalog(viewsRoot);
    const view = viewCatalog.find(view => view.viewId === identity.viewId);
    if (!view) throw new Error(`View "${identity.viewId}" from sample key not found in catalog`);
    const tuple = matchTargets([target], [entry], [view]).tuples[0];
    if (!tuple) throw new CompatibilityContractError(`Sample ${sampleKey} has no current compatible generation plan.`);
    if (recordedPlan) validateGenerationPlan(recordedPlan);
    if (recordedPlan && (recordedPlan.hash !== tuple.plan.hash || recordedPlan.inputHash !== tuple.plan.inputHash)) {
        throw new CompatibilityContractError('Recorded generation plan is stale; regenerate this sample explicitly.');
    }
    const origin = replay ? parseSampleKey(replay.sampleKey) : identity;
    if (origin.targetId !== identity.targetId || origin.generatorId !== identity.generatorId
        || origin.viewId !== identity.viewId || origin.split !== identity.split || origin.instanceIdx !== identity.instanceIdx
        || (origin.mode !== identity.mode && !(identity.mode === 'solution' && origin.mode === 'question'))) {
        throw new CompatibilityContractError('Recorded draw origin belongs to a different sample slot.');
    }
    const originKey = replay?.sampleKey ?? sampleKey;
    const originAttempt = replay?.attempt ?? attempt;
    const seed = computeSampleSeed(originKey, originAttempt);
    const draw = generatePlannedDraw({generator: entry.generator, viewSchema: view.schema, plan: tuple.plan,
        sampleKey: originKey, attempt: originAttempt, seed, replay});
    return {identity, target, targetLabels, seed, stub: draw.stub, plan: tuple.plan,
        preparedView: draw.view, replay: draw.replay, labels: draw.labels};
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
    plan: GenerationPlan;
    preparedView?: PreparedViewConfiguration;
    replay?: GenerationReplay;
    labels?: string[];
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
    const viewsById = new Map(viewCatalog.map(entry => [entry.viewId, entry]));

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
                    let draw: PlannedRetryResult | undefined;
                    try {
                        draw = generatePlannedSampleWithRetry({
                            generator,
                            viewSchema: viewsById.get(tuple.viewId)!.schema,
                            plan: tuple.plan,
                            sampleKey,
                            maxAttempts
                        });
                        ({stub, attempt, seed} = draw);
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
                        error,
                        plan: tuple.plan,
                        preparedView: draw?.view,
                        replay: draw?.replay,
                        labels: draw?.labels
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

export interface ResolvePairCapabilitiesInput<T extends ConfigSchema> {
    targetLabels: readonly string[];
    generatorGeneralLabels: readonly string[];
    generatorResolvedLabels: readonly string[];
    viewGeneralLabels: readonly string[];
    viewSchema: T;
    seed: number;
}

export interface ResolvedPairCapabilities<T extends ConfigSchema> {
    labels: string[];
    viewConfig: ConfigFromSchema<T>;
    viewResolvedLabels: string[];
}

/**
 * Resolves the exact positive capabilities realized by one generated pair.
 * Target labels select schema behavior but never enter the emitted set by themselves.
 * Applicability-only required/rejected labels are deliberately absent from this contract.
 */
export function resolvePairCapabilities<T extends ConfigSchema>({
    targetLabels,
    generatorGeneralLabels,
    generatorResolvedLabels,
    viewGeneralLabels,
    viewSchema,
    seed
}: ResolvePairCapabilitiesInput<T>): ResolvedPairCapabilities<T> {
    const viewResolution = resolveViewConfigWithLabels(viewSchema, [...targetLabels], seed);
    return {
        labels: radixSortUtf8([...new Set([
            ...generatorGeneralLabels,
            ...generatorResolvedLabels,
            ...viewGeneralLabels,
            ...viewResolution.resolvedLabels
        ])]),
        viewConfig: viewResolution.config,
        viewResolvedLabels: viewResolution.resolvedLabels
    };
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
        labels: radixSortUtf8([...new Set(labels)])
    };
}

export interface BuildRenderPayloadInput {
    problem: AbstractProblem;
    viewId: string;
    targetLabels: string[];
    mode: SampleMode;
    seed: number;
    preparedView: PreparedViewConfiguration;
}

/** Single constructor for the payload contract, including the render seed. */
export function buildRenderPayload({ problem, viewId, targetLabels, mode, seed, preparedView }: BuildRenderPayloadInput): RenderPayload {
    if (preparedView.viewId !== viewId) {
        throw new CompatibilityContractError('Prepared configuration belongs to a different view.');
    }
    return {
        problem,
        viewId,
        targetLabels,
        isSolutionView: mode === 'solution',
        seed,
        preparedView
    };
}
