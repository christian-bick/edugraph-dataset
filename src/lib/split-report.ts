/**
 * Train/validation split integrity analysis.
 *
 * The split is only worth reporting metrics against if it holds three
 * properties, none of which the generation pipeline can assert about itself:
 *
 * 1. **Disjointness** — no content in validation also appears in train for the
 *    same view. A leak makes validation accuracy an optimistic estimate.
 * 2. **Non-redundancy** — within a split, no two exercises of a view show the
 *    same content. (A question and its own solution sharing content is the
 *    documented small-content-space fallback, not redundancy.)
 * 3. **Representativeness** — the realized ratio is close to the requested one,
 *    and every view and label carrying train mass also carries val mass.
 *    Otherwise per-view and per-label validation metrics simply do not exist.
 *
 * All analysis here reads the on-disk metadata only, so it audits the dataset
 * that was actually produced rather than re-deriving what should have been.
 * A tuple that produced nothing in *either* split is invisible to it by
 * construction — `show:matching` is the tool that covers matching failures.
 */

import { MetadataRow, exerciseKey } from './dataset-merge.ts';
import { isValTuple } from './generation.ts';

/** The allocation unit: one matched (target, generator, view) tuple. */
export function tupleKey(row: MetadataRow): string {
    return [row.target_id, row.generator, row.view].join('#');
}

/** Content index of a split: view -> fingerprint -> the exercises claiming it. */
export type ContentIndex = Map<string, Map<string, Set<string>>>;

export function indexContent(rows: MetadataRow[]): ContentIndex {
    const index: ContentIndex = new Map();
    for (const row of rows) {
        if (!index.has(row.view)) index.set(row.view, new Map());
        const byFingerprint = index.get(row.view)!;
        if (!byFingerprint.has(row.content_fingerprint)) byFingerprint.set(row.content_fingerprint, new Set());
        byFingerprint.get(row.content_fingerprint)!.add(exerciseKey(row));
    }
    return index;
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
 * Content shown by more than one exercise of the same view within a split.
 * Grouping by exercise is what distinguishes real redundancy from the
 * question/solution fallback, where one exercise legitimately claims a
 * fingerprint in both modes.
 */
export function findWithinSplitRedundancy(rows: MetadataRow[], split: string): Redundancy[] {
    const redundancies: Redundancy[] = [];
    for (const [view, byFingerprint] of indexContent(rows)) {
        for (const [fingerprint, exercises] of byFingerprint) {
            if (exercises.size > 1) {
                redundancies.push({ split, view, fingerprint, exercises: [...exercises].sort() });
            }
        }
    }
    return redundancies;
}

export interface AllocationStats {
    tuples: number;
    allocated: number;
    realized: number;
    /** Allocated tuples that produced no validation sample at all. */
    unrealized: string[];
}

/**
 * Compares the tuples the allocator selects for validation against the ones
 * that actually produced samples. The gap is the silent-drop rate: tuples
 * whose generator could not find content disjoint from train within its retry
 * budget.
 */
export function analyzeAllocation(train: MetadataRow[], val: MetadataRow[], valRatio: number): AllocationStats {
    const tuples = new Map<string, MetadataRow>();
    for (const row of train) {
        if (!tuples.has(tupleKey(row))) tuples.set(tupleKey(row), row);
    }
    const realized = new Set(val.map(tupleKey));

    const allocated: string[] = [];
    for (const [key, row] of tuples) {
        if (isValTuple(row.target_id, row.generator, row.view, valRatio)) allocated.push(key);
    }

    return {
        tuples: tuples.size,
        allocated: allocated.length,
        realized: realized.size,
        unrealized: allocated.filter(key => !realized.has(key)).sort(),
    };
}

export interface ViewCoverage {
    view: string;
    trainRows: number;
    valRows: number;
    allocatedTuples: number;
}

/** Per-view train/val mass, worst-covered first. */
export function analyzeViewCoverage(train: MetadataRow[], val: MetadataRow[], valRatio: number): ViewCoverage[] {
    const views = new Map<string, ViewCoverage>();
    const ensure = (view: string) => {
        if (!views.has(view)) views.set(view, { view, trainRows: 0, valRows: 0, allocatedTuples: 0 });
        return views.get(view)!;
    };

    const countedTuples = new Set<string>();
    for (const row of train) {
        ensure(row.view).trainRows++;
        const key = tupleKey(row);
        if (!countedTuples.has(key) && isValTuple(row.target_id, row.generator, row.view, valRatio)) {
            countedTuples.add(key);
            ensure(row.view).allocatedTuples++;
        }
    }
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
            for (const label of row.tags ?? []) {
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
    valRatio: number
): SplitIntegrityReport {
    const leaks = findCrossSplitLeaks(train, val);
    const redundancy = [
        ...findWithinSplitRedundancy(train, 'train'),
        ...findWithinSplitRedundancy(val, 'validation'),
    ];
    const total = train.length + val.length;

    return {
        trainRows: train.length,
        valRows: val.length,
        valShare: total > 0 ? val.length / total : 0,
        requestedRatio: valRatio,
        allocation: analyzeAllocation(train, val, valRatio),
        leaks,
        redundancy,
        viewCoverage: analyzeViewCoverage(train, val, valRatio),
        labelCoverage: analyzeLabelCoverage(train, val),
        hasErrors: leaks.length > 0 || redundancy.length > 0,
    };
}
