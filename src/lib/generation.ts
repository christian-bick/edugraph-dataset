import { createHash } from 'crypto';
import { existsSync, lstatSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Ability } from 'edugraph-ts';
import { isSubConceptOf, isCompatibleConcept } from './ontology.ts';
import { findLeafModules, LeafModule } from './module-resolver.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType } from './type-parser.ts';
import { extractSchemaLabels, generateWithLabels } from './utils.ts';
import { setSeed } from './random.ts';
import { CompetencyTarget, ProblemGenerator, ProblemStub, AbstractProblem, RenderPayload } from '../types/ml-engine.ts';
import { ViewSpec } from '../types/view-spec.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const EDU_PREFIX = 'http://edugraph.io/edu/';
const ABILITIES = new Set<string>(Object.values(Ability));

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

export interface SampleIdentity {
    targetId: string;
    generatorId: string;
    viewId: string;
    split: SampleSplit;
    mode: SampleMode;
    instanceIdx: number;
}

const KEY_SEPARATOR = '#';
const MODE_TAGS: Record<SampleMode, string> = { question: 'Q', solution: 'S' };

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
        + `_inst-${instanceIdx}_mode-${MODE_TAGS[mode]}.png`;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export interface GeneratorMatchInfo {
    generatorId: string;
    /** Union of spec generalLabels and schema-extracted labels */
    labels: string[];
    problemType?: string | null;
}

export interface ViewMatchInfo {
    viewId: string;
    /** Union of spec generalLabels and view-schema-extracted labels */
    supportedLabels: string[];
    rejectedLabels?: readonly string[];
    problemType?: string | null;
}

export type MatchFailureReason = 'incompatible-type' | 'unsupported-label' | 'rejected-label';

export type MatchVerdict =
    | { matched: true }
    | { matched: false; reason: MatchFailureReason; label?: string };

/**
 * The single matching predicate for (target, generator, view) triples.
 * Covers problem-type compatibility, label support and view rejection in one
 * place so no caller can apply a partial rule set.
 */
export function matchesTarget(
    targetLabels: string[],
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): MatchVerdict {
    if (generatorInfo.problemType != null && viewInfo.problemType != null
        && generatorInfo.problemType !== viewInfo.problemType) {
        return { matched: false, reason: 'incompatible-type' };
    }

    for (const compLabel of targetLabels) {
        if (!compLabel.startsWith(EDU_PREFIX)) continue;
        if (ABILITIES.has(compLabel)) {
            if (!viewInfo.supportedLabels.some(viewLabel => isCompatibleConcept(compLabel, viewLabel))) {
                return { matched: false, reason: 'unsupported-label', label: compLabel };
            }
            continue;
        }
        const supportedByGen = generatorInfo.labels.some(genLabel => isSubConceptOf(compLabel, genLabel));
        const supportedByView = viewInfo.supportedLabels.some(viewLabel => isCompatibleConcept(compLabel, viewLabel));
        if (!supportedByGen && !supportedByView) {
            return { matched: false, reason: 'unsupported-label', label: compLabel };
        }
    }

    const rejected = viewInfo.rejectedLabels?.find(label => targetLabels.includes(label));
    if (rejected) {
        return { matched: false, reason: 'rejected-label', label: rejected };
    }

    return { matched: true };
}

export interface MatchTuple {
    target: CompetencyTarget;
    generatorId: string;
    viewId: string;
}

export interface MatchRejection {
    targetId: string;
    generatorId: string;
    viewId: string;
    verdict: Exclude<MatchVerdict, { matched: true }>;
}

export interface MatchResult {
    tuples: MatchTuple[];
    /** Label-level failures for type-compatible pairs (type mismatches are omitted as noise) */
    rejections: MatchRejection[];
}

/**
 * Produces the full deterministic list of (target, generator, view) tuples
 * the pipeline generates samples for, in stable iteration order
 * (targets in given order, then generators, then views, each in catalog order).
 */
export function matchTargets(
    targets: CompetencyTarget[],
    generatorCatalog: GeneratorMatchInfo[],
    viewCatalog: ViewMatchInfo[]
): MatchResult {
    const tuples: MatchTuple[] = [];
    const rejections: MatchRejection[] = [];

    for (const target of targets) {
        for (const generatorInfo of generatorCatalog) {
            for (const viewInfo of viewCatalog) {
                const verdict = matchesTarget(target.labels, generatorInfo, viewInfo);
                if (verdict.matched) {
                    tuples.push({ target, generatorId: generatorInfo.generatorId, viewId: viewInfo.viewId });
                } else if (verdict.reason !== 'incompatible-type') {
                    rejections.push({
                        targetId: target.id,
                        generatorId: generatorInfo.generatorId,
                        viewId: viewInfo.viewId,
                        verdict
                    });
                }
            }
        }
    }

    return { tuples, rejections };
}

// ---------------------------------------------------------------------------
// Catalog loading
// ---------------------------------------------------------------------------

export interface GeneratorCatalogEntry extends GeneratorMatchInfo {
    module: LeafModule;
    spec: any;
    generator: ProblemGenerator;
}

export interface ViewCatalogEntry extends ViewMatchInfo {
    module: LeafModule;
    spec: ViewSpec;
}

function camelCase(str: string): string {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

export async function loadGeneratorCatalog(
    generatorsRoot: string = resolve(PROJECT_ROOT, 'src', 'generators')
): Promise<GeneratorCatalogEntry[]> {
    const entries: GeneratorCatalogEntry[] = [];
    for (const mod of findLeafModules(generatorsRoot)) {
        try {
            const specModule = await import(pathToFileURL(resolve(mod.absolutePath, 'spec.ts')).href);
            const className = camelCase(mod.id[0].toUpperCase() + mod.id.slice(1)) + 'Generator';
            const generatorModule = await import(pathToFileURL(resolve(mod.absolutePath, 'generator.ts')).href);
            const GeneratorClass = generatorModule[className];
            if (!GeneratorClass) {
                console.warn(`Generator class ${className} not found in ${mod.id}, skipping.`);
                continue;
            }
            const generator: ProblemGenerator = new GeneratorClass();
            entries.push({
                generatorId: mod.id,
                module: mod,
                spec: specModule.spec,
                generator,
                labels: Array.from(new Set([
                    ...(specModule.spec?.generalLabels || []),
                    ...extractSchemaLabels(generator.schema)
                ])),
                problemType: getGeneratorProblemType(mod.id)
            });
        } catch (e) {
            console.warn(`Could not load generator module ${mod.id}:`, e);
        }
    }
    return entries;
}

export async function loadViewCatalog(
    viewsRoot: string = resolve(PROJECT_ROOT, 'src', 'visuals', 'views')
): Promise<ViewCatalogEntry[]> {
    const viewToType = getViewToProblemTypeMap();
    const entries: ViewCatalogEntry[] = [];
    for (const mod of findLeafModules(viewsRoot)) {
        try {
            const specModule = await import(pathToFileURL(resolve(mod.absolutePath, 'spec.ts')).href);
            const spec: ViewSpec = specModule.spec;
            const schemaName = camelCase(mod.id[0].toUpperCase() + mod.id.slice(1)) + 'ViewSchema';
            const viewSchema = specModule[schemaName];
            entries.push({
                viewId: spec.viewId,
                module: mod,
                spec,
                supportedLabels: Array.from(new Set([
                    ...(spec?.generalLabels || []),
                    ...extractSchemaLabels(viewSchema)
                ])),
                rejectedLabels: spec?.rejectedLabels || [],
                problemType: viewToType[spec.viewId] || null
            });
        } catch (e) {
            console.warn(`Could not load view module ${mod.id}:`, e);
        }
    }
    return entries;
}

/**
 * Loads all competency targets from a spec module (a directory of .ts files
 * or a single .ts file under src/spec). Files are visited in sorted order so
 * the resulting target order is deterministic.
 */
export async function loadTargets(
    specName: string,
    specRoot: string = resolve(PROJECT_ROOT, 'src', 'spec')
): Promise<CompetencyTarget[]> {
    const specPath = resolve(specRoot, specName);
    const specDir = existsSync(specPath) && lstatSync(specPath).isDirectory() ? specPath : null;
    const specFile = !specDir && existsSync(`${specPath}.ts`) ? `${specPath}.ts` : null;

    if (!specDir && !specFile) {
        throw new Error(`Spec module not found at: ${specPath}`);
    }

    const files = specDir
        ? readdirSync(specDir).filter(f => f.endsWith('.ts')).sort().map(f => resolve(specDir, f))
        : [specFile!];

    const targets: CompetencyTarget[] = [];
    for (const filePath of files) {
        const module = await import(pathToFileURL(filePath).href);
        for (const [, value] of Object.entries(module)) {
            if (Array.isArray(value)) {
                targets.push(...(value as CompetencyTarget[]));
            }
        }
    }
    return targets;
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
export function generateSample({ generator, labels, seed }: GenerateSampleInput): ProblemStub | null {
    setSeed(seed);
    return generateWithLabels(generator, labels);
}

export interface GenerateSampleWithRetryInput {
    generator: ProblemGenerator;
    labels: string[];
    sampleKey: string;
    maxAttempts?: number;
    /** Caller-defined dedup scope; return true to reject a draw and retry */
    isDuplicate?: (stub: ProblemStub) => boolean;
}

export interface RetryResult {
    stub: ProblemStub | null;
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
        if (isDuplicate && isDuplicate(stub)) continue;
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
    stub: ProblemStub | null;
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
    stub: ProblemStub | null;
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
 * the val split when the target is val-allocated. No cross-target dedup is
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
    const { instancesPerTuple = 1, valRatio = 0.25, maxAttempts = 50 } = options;
    const { tuples } = matchTargets([target], generatorCatalog, viewCatalog);
    const splits: SampleSplit[] = isValTarget(target.id, valRatio) ? ['train', 'val'] : ['train'];
    const modes: SampleMode[] = ['question', 'solution'];

    const samples: TargetSample[] = [];
    for (const tuple of tuples) {
        const generator = generatorCatalog.find(g => g.generatorId === tuple.generatorId)!.generator;
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
                    let stub: ProblemStub | null = null;
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
    const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
    return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',') + '}';
}

/**
 * Order-independent hash of a problem's data, used to detect duplicate
 * content instead of relying on generator-authored stub id strings.
 */
export function computeContentFingerprint(data: any): string {
    return createHash('sha256').update(canonicalJson(data)).digest('hex').slice(0, 16);
}

/**
 * Deterministic, order-independent val-split allocation: a target is
 * val-allocated purely as a function of its id, so val membership survives
 * unrelated reorderings. Salted so it does not correlate with sample seeds.
 */
export function isValTarget(targetId: string, ratio: number): boolean {
    if (ratio <= 0) return false;
    if (ratio >= 1) return true;
    return fnv1a(`val-split${KEY_SEPARATOR}${targetId}`) % 10000 < ratio * 10000;
}

export interface BuildProblemInput {
    stub: ProblemStub;
    sampleKey: string;
    type: AbstractProblem['type'];
    labels: string[];
}

/**
 * Wraps a generated stub into the AbstractProblem sent to the renderer. The
 * problem id is the sample key — stable, unique and carrying no entropy role
 * (views draw all randomness from the render seed).
 */
export function buildProblem({ stub, sampleKey, type, labels }: BuildProblemInput): AbstractProblem {
    return {
        id: sampleKey,
        type,
        data: stub.data,
        tags: Array.from(new Set([...labels, ...(stub.tags || [])]))
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
