/**
 * Train/validation split integrity analysis.
 *
 * The split is only worth reporting metrics against if it holds three
 * properties, none of which the generation pipeline can assert about itself:
 *
 * 1. **Disjointness** — no content in validation also appears in train for the
 *    same view. A leak makes validation accuracy an optimistic estimate.
 * 2. **Non-redundancy** — within a split, no two exercises of a view show the
 *    same configured task. (A question and its own solution sharing a task is the
 *    documented small-content-space fallback, not redundancy.)
 * 3. **Representativeness** — the realized ratio is close to the requested one,
 *    and every view and label carrying train mass also carries val mass.
 *    Otherwise per-view and per-label validation metrics simply do not exist.
 *
 * Physical integrity reads the on-disk rows. Allocation coverage additionally
 * uses the snapshot's persisted matching plans when available, so a matched
 * tuple missing from both splits remains visible. Validated associations count
 * as represented tuples without increasing image or label row counts.
 */

import { MetadataRow, exerciseKey, rowTaskFingerprint } from './dataset-merge.ts';
import { isValTuple } from './generation.ts';
import type {GenerationPlan} from '../types/compatibility.ts';
import {CompatibilityContractError, validateGenerationPlan, validateGenerationSelectionReceipt} from './compatibility.ts';
import {selectionAdmittedByPlan} from './planned-generation.ts';
import {readSampleReplayRecord} from './sample-replay.ts';
import {publishedLabelsCoverRequested} from './asset-index.ts';

/** The allocation unit: one matched (target, generator, view) tuple. */
export function tupleKey(row: MetadataRow): string {
    return [row.target_id, row.generator, row.view].join('#');
}

/** Content index of a split: view -> fingerprint -> the exercises claiming it. */
export type ContentIndex = Map<string, Map<string, Set<string>>>;

function indexRows(rows: MetadataRow[], fingerprintFor: (row: MetadataRow) => string): ContentIndex {
    const index: ContentIndex = new Map();
    for (const row of rows) {
        if (!index.has(row.view)) index.set(row.view, new Map());
        const byFingerprint = index.get(row.view)!;
        const fingerprint = fingerprintFor(row);
        if (!byFingerprint.has(fingerprint)) byFingerprint.set(fingerprint, new Set());
        byFingerprint.get(fingerprint)!.add(exerciseKey(row));
    }
    return index;
}

export function indexContent(rows: MetadataRow[]): ContentIndex {
    return indexRows(rows, row => row.content_fingerprint);
}

export function indexTasks(rows: MetadataRow[]): ContentIndex {
    return indexRows(rows, rowTaskFingerprint);
}

export interface Leak {
    sampleKey: string;
    view: string;
    mode: string;
    fingerprint: string;
    /** The train exercises already showing this content. */
    trainExercises: string[];
}

/** Validation rows whose content already exists in train for the same view. */
export function findCrossSplitLeaks(train: MetadataRow[], val: MetadataRow[]): Leak[] {
    const trainIndex = indexContent(train);
    const leaks: Leak[] = [];
    for (const row of val) {
        const claimants = trainIndex.get(row.view)?.get(row.content_fingerprint);
        if (!claimants) continue;
        leaks.push({
            sampleKey: row.sample_key,
            view: row.view,
            mode: row.mode,
            fingerprint: row.content_fingerprint,
            trainExercises: [...claimants].sort(),
        });
    }
    return leaks;
}

export interface Redundancy {
    split: string;
    view: string;
    fingerprint: string;
    exercises: string[];
}

/**
 * The same rendered task shown by more than one exercise of a view within a split.
 * Grouping by exercise is what distinguishes real redundancy from the
 * question/solution fallback, where one exercise legitimately claims a
 * fingerprint in both modes.
 */
export function findWithinSplitRedundancy(rows: MetadataRow[], split: string): Redundancy[] {
    const redundancies: Redundancy[] = [];
    for (const [view, byFingerprint] of indexTasks(rows)) {
        for (const [fingerprint, exercises] of byFingerprint) {
            if (exercises.size > 1) {
                redundancies.push({ split, view, fingerprint, exercises: [...exercises].sort() });
            }
        }
    }
    return redundancies;
}

export interface AllocationStats {
    denominator: 'matched' | 'observed';
    tuples: number;
    allocated: number;
    /** Allocated tuples represented by validation rows, including associations. */
    realized: number;
    primaryTrainTuples: number;
    primaryValTuples: number;
    trainRepresented: number;
    /** Matched tuples without either a primary train row or a validated train association. */
    missingTrain: string[];
    /** Matched tuples unrepresented in both splits. */
    missingEverywhere: string[];
    /** Allocated tuples with no validation representation. */
    unrealized: string[];
}

export interface SplitAllocationContext {
    /** Complete plans from the same immutable snapshot as the audited rows. */
    plans: readonly GenerationPlan[];
}

type AllocationTuple = GenerationPlan['identity'];
const allocationTupleKey = (tuple: AllocationTuple): string =>
    [tuple.targetId, tuple.generatorId, tuple.viewId].join('#');
const rowTuple = (row: MetadataRow): AllocationTuple =>
    ({targetId: row.target_id, generatorId: row.generator, viewId: row.view});
const samePlan = (left: GenerationPlan | undefined, right: GenerationPlan): boolean =>
    left?.hash === right.hash && left?.inputHash === right.inputHash;

function allocationIndex(train: MetadataRow[], val: MetadataRow[], context?: SplitAllocationContext) {
    const plans = new Map<string, GenerationPlan>();
    for (const candidate of context?.plans ?? []) {
        const plan = validateGenerationPlan(candidate);
        const key = allocationTupleKey(plan.identity);
        if (plans.has(key) && !samePlan(plans.get(key), plan)) {
            throw new CompatibilityContractError(`Conflicting allocation plans for ${key}.`);
        }
        plans.set(key, plan);
    }
    const tuples = new Map<string, AllocationTuple>(context
        ? [...plans].map(([key, plan]) => [key, plan.identity])
        : [...train, ...val].map(row => [tupleKey(row), rowTuple(row)]));
    const represented = (rows: MetadataRow[]) => {
        const keys = new Set<string>();
        for (const row of rows) {
            const key = tupleKey(row);
            if (context && !tuples.has(key)) {
                throw new CompatibilityContractError(`Sample tuple ${key} is absent from the snapshot matching plans.`);
            }
            keys.add(key);
            const associations = (row.target_associations ?? []).filter(association => association.spec === row.spec);
            if (associations.length === 0) continue;
            const source = readSampleReplayRecord(row.sample_key, row);
            if (allocationTupleKey(source.recordedPlan.identity) !== key
                || (context && !samePlan(plans.get(key), source.recordedPlan))) {
                throw new CompatibilityContractError(`Sample plan disagrees with allocation tuple ${key}.`);
            }
            for (const association of associations) {
                const plan = validateGenerationPlan(association.generation_plan);
                const identity = {...rowTuple(row), targetId: association.target_id};
                const associationKey = allocationTupleKey(identity);
                if (allocationTupleKey(plan.identity) !== associationKey
                    || association.generation_plan_hash !== plan.hash
                    || (context && !samePlan(plans.get(associationKey), plan))) {
                    throw new CompatibilityContractError(`Association plan disagrees with allocation tuple ${associationKey}.`);
                }
                const selection = validateGenerationSelectionReceipt(plan, association.selection);
                const admitted = selectionAdmittedByPlan(plan, source.recordedPlan, source.replay.selection);
                if (!admitted || admitted.variantHash !== selection.variantHash) {
                    throw new CompatibilityContractError(`Association does not admit the actual sample selection for ${associationKey}.`);
                }
                if (!publishedLabelsCoverRequested(row.labels ?? [], plan.targetLabels)) {
                    throw new CompatibilityContractError(`Published labels do not cover associated target ${associationKey}.`);
                }
                if (!context) tuples.set(associationKey, identity);
                keys.add(associationKey);
            }
        }
        return keys;
    };
    const trainRepresented = represented(train);
    const valRepresented = represented(val);
    return {tuples, trainRepresented, valRepresented};
}

/**
 * Compares allocated tuples with physical or validated associated evidence.
 * Missing evidence does not itself establish numeric failure or finite-space
 * exhaustion; the retry diagnostics distinguish those causes.
 */
export function analyzeAllocation(train: MetadataRow[], val: MetadataRow[], valRatio: number,
    context?: SplitAllocationContext): AllocationStats {
    return allocationStats(train, val, valRatio, allocationIndex(train, val, context), context !== undefined);
}

function allocationStats(train: MetadataRow[], val: MetadataRow[], valRatio: number,
    index: ReturnType<typeof allocationIndex>, authoritative: boolean): AllocationStats {
    const {tuples, trainRepresented, valRepresented} = index;
    const allocated: string[] = [];
    for (const [key, tuple] of tuples) {
        if (isValTuple(tuple.targetId, tuple.generatorId, tuple.viewId, valRatio)) allocated.push(key);
    }
    return {
        denominator: authoritative ? 'matched' : 'observed',
        tuples: tuples.size,
        allocated: allocated.length,
        realized: allocated.filter(key => valRepresented.has(key)).length,
        primaryTrainTuples: new Set(train.map(tupleKey)).size,
        primaryValTuples: new Set(val.map(tupleKey)).size,
        trainRepresented: trainRepresented.size,
        missingTrain: [...tuples.keys()].filter(key => !trainRepresented.has(key)).sort(),
        missingEverywhere: [...tuples.keys()].filter(key => !trainRepresented.has(key) && !valRepresented.has(key)).sort(),
        unrealized: allocated.filter(key => !valRepresented.has(key)).sort(),
    };
}

export interface ViewCoverage {
    view: string;
    trainRows: number;
    valRows: number;
    allocatedTuples: number;
}

/** Per-view train/val mass, worst-covered first. */
export function analyzeViewCoverage(train: MetadataRow[], val: MetadataRow[], valRatio: number,
    context?: SplitAllocationContext): ViewCoverage[] {
    return viewCoverage(train, val, valRatio, allocationIndex(train, val, context).tuples);
}

function viewCoverage(train: MetadataRow[], val: MetadataRow[], valRatio: number,
    tuples: ReadonlyMap<string, AllocationTuple>): ViewCoverage[] {
    const views = new Map<string, ViewCoverage>();
    const ensure = (view: string) => {
        if (!views.has(view)) views.set(view, { view, trainRows: 0, valRows: 0, allocatedTuples: 0 });
        return views.get(view)!;
    };

    for (const tuple of tuples.values()) {
        const entry = ensure(tuple.viewId);
        if (isValTuple(tuple.targetId, tuple.generatorId, tuple.viewId, valRatio)) entry.allocatedTuples++;
    }
    for (const row of train) ensure(row.view).trainRows++;
    for (const row of val) ensure(row.view).valRows++;

    return [...views.values()].sort((a, b) => a.valRows - b.valRows || a.view.localeCompare(b.view));
}

export interface LabelCoverage {
    label: string;
    trainRows: number;
    valRows: number;
}

/** Labels carrying train mass, least-covered by validation first. */
export function analyzeLabelCoverage(train: MetadataRow[], val: MetadataRow[]): LabelCoverage[] {
    const labels = new Map<string, LabelCoverage>();
    const tally = (rows: MetadataRow[], field: 'trainRows' | 'valRows') => {
        for (const row of rows) {
            for (const label of row.labels ?? []) {
                if (!labels.has(label)) labels.set(label, { label, trainRows: 0, valRows: 0 });
                labels.get(label)![field]++;
            }
        }
    };
    tally(train, 'trainRows');
    tally(val, 'valRows');

    return [...labels.values()]
        .filter(entry => entry.trainRows > 0)
        .sort((a, b) => a.valRows - b.valRows || b.trainRows - a.trainRows || a.label.localeCompare(b.label));
}

export interface SplitIntegrityReport {
    trainRows: number;
    valRows: number;
    /** Validation share of all rows. */
    valShare: number;
    requestedRatio: number;
    allocation: AllocationStats;
    leaks: Leak[];
    redundancy: Redundancy[];
    viewCoverage: ViewCoverage[];
    labelCoverage: LabelCoverage[];
    /** Leaks and redundancy are defects; everything else is reported as context. */
    hasErrors: boolean;
}

export function buildSplitIntegrityReport(
    train: MetadataRow[],
    val: MetadataRow[],
    valRatio: number,
    context?: SplitAllocationContext
): SplitIntegrityReport {
    const leaks = findCrossSplitLeaks(train, val);
    const redundancy = [
        ...findWithinSplitRedundancy(train, 'train'),
        ...findWithinSplitRedundancy(val, 'validation'),
    ];
    const total = train.length + val.length;
    const allocation = allocationIndex(train, val, context);

    return {
        trainRows: train.length,
        valRows: val.length,
        valShare: total > 0 ? val.length / total : 0,
        requestedRatio: valRatio,
        allocation: allocationStats(train, val, valRatio, allocation, context !== undefined),
        leaks,
        redundancy,
        viewCoverage: viewCoverage(train, val, valRatio, allocation.tuples),
        labelCoverage: analyzeLabelCoverage(train, val),
        hasErrors: leaks.length > 0 || redundancy.length > 0,
    };
}
