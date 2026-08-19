import { describe, it, expect } from 'vitest';
import { MetadataRow } from './dataset-merge.ts';
import { isValTuple, DEFAULT_VAL_RATIO } from './generation.ts';
import {
    tupleKey,
    indexContent,
    indexTasks,
    findCrossSplitLeaks,
    findWithinSplitRedundancy,
    analyzeAllocation,
    analyzeViewCoverage,
    analyzeLabelCoverage,
    buildSplitIntegrityReport,
} from './split-report.ts';

let rowCounter = 0;

function row(overrides: Partial<MetadataRow> = {}): MetadataRow {
    const target_id = overrides.target_id ?? 't1';
    const generator = overrides.generator ?? 'gen';
    const view = overrides.view ?? 'view-a';
    const mode = overrides.mode ?? 'question';
    const instance = overrides.instance ?? 0;
    return {
        file_name: `f-${rowCounter++}.png`,
        sample_key: `${target_id}#${generator}#${view}#train#${mode}#inst:${instance}`,
        spec: 'test',
        target_id,
        generator,
        view,
        mode,
        instance,
        content_fingerprint: 'fp-0',
        ...overrides,
    };
}

/** A (target, generator, view) tuple that the allocator does / does not pick. */
function findTarget(allocated: boolean): string {
    for (let i = 0; i < 500; i++) {
        const id = `t-${i}`;
        if (isValTuple(id, 'gen', 'view-a', DEFAULT_VAL_RATIO) === allocated) return id;
    }
    throw new Error('no suitable target id found');
}

describe('tupleKey', () => {
    it('identifies the allocation unit, ignoring mode and instance', () => {
        expect(tupleKey(row({ mode: 'question' }))).toBe(tupleKey(row({ mode: 'solution' })));
        expect(tupleKey(row({ view: 'view-a' }))).not.toBe(tupleKey(row({ view: 'view-b' })));
    });
});

describe('indexContent', () => {
    it('groups fingerprints by view and collects the exercises claiming them', () => {
        const index = indexContent([
            row({ view: 'view-a', content_fingerprint: 'fp-1', mode: 'question' }),
            row({ view: 'view-a', content_fingerprint: 'fp-1', mode: 'solution' }),
            row({ view: 'view-b', content_fingerprint: 'fp-1' }),
        ]);
        // Same fingerprint in two views stays separate — a different view is a
        // different image.
        expect(index.get('view-a')!.get('fp-1')!.size).toBe(1);
        expect(index.get('view-b')!.get('fp-1')!.size).toBe(1);
    });

    it('keeps task configuration separate from mathematical content', () => {
        const rows = [
            row({ content_fingerprint: 'fp-1', task_fingerprint: 'task-a', target_id: 't1' }),
            row({ content_fingerprint: 'fp-1', task_fingerprint: 'task-b', target_id: 't2' }),
        ];
        expect(indexContent(rows).get('view-a')!.get('fp-1')!.size).toBe(2);
        expect(indexTasks(rows).get('view-a')!.size).toBe(2);
    });
});

describe('findCrossSplitLeaks', () => {
    it('flags validation content already present in train for the same view', () => {
        const train = [row({
            view: 'view-a', content_fingerprint: 'fp-1', task_fingerprint: 'task-a',
        })];
        const val = [row({
            view: 'view-a', content_fingerprint: 'fp-1', task_fingerprint: 'task-b', target_id: 't2',
        })];
        const leaks = findCrossSplitLeaks(train, val);
        expect(leaks).toHaveLength(1);
        expect(leaks[0].fingerprint).toBe('fp-1');
        expect(leaks[0].trainExercises).toEqual(['t1#gen#view-a#0']);
    });

    it('catches a question leaking against a train solution', () => {
        // The regression this exists for: solutions used to be exempt from
        // dedup, so their content was invisible across the split boundary.
        const train = [row({ mode: 'solution', content_fingerprint: 'fp-9' })];
        const val = [row({ mode: 'question', content_fingerprint: 'fp-9', target_id: 't2' })];
        expect(findCrossSplitLeaks(train, val)).toHaveLength(1);
    });

    it('does not flag identical content rendered in a different view', () => {
        const train = [row({ view: 'view-a', content_fingerprint: 'fp-1' })];
        const val = [row({ view: 'view-b', content_fingerprint: 'fp-1' })];
        expect(findCrossSplitLeaks(train, val)).toEqual([]);
    });

    it('returns nothing for disjoint splits', () => {
        const train = [row({ content_fingerprint: 'fp-1' })];
        const val = [row({ content_fingerprint: 'fp-2' })];
        expect(findCrossSplitLeaks(train, val)).toEqual([]);
    });
});

describe('findWithinSplitRedundancy', () => {
    it('accepts a question and its own solution sharing content', () => {
        // The small-content-space fallback: one exercise, shown unsolved and
        // solved.
        const rows = [
            row({ mode: 'question', content_fingerprint: 'fp-1' }),
            row({ mode: 'solution', content_fingerprint: 'fp-1' }),
        ];
        expect(findWithinSplitRedundancy(rows, 'train')).toEqual([]);
    });

    it('flags two different exercises showing the same configured task', () => {
        const rows = [
            row({ target_id: 't1', content_fingerprint: 'fp-1' }),
            row({ target_id: 't2', content_fingerprint: 'fp-1' }),
        ];
        const found = findWithinSplitRedundancy(rows, 'train');
        expect(found).toHaveLength(1);
        expect(found[0].exercises).toEqual(['t1#gen#view-a#0', 't2#gen#view-a#0']);
        expect(found[0].split).toBe('train');
    });

    it('accepts the same data rendered as two different configured tasks', () => {
        const rows = [
            row({ target_id: 't1', content_fingerprint: 'fp-1', task_fingerprint: 'task-vocabulary' }),
            row({ target_id: 't2', content_fingerprint: 'fp-1', task_fingerprint: 'task-composition' }),
        ];
        expect(findWithinSplitRedundancy(rows, 'train')).toEqual([]);
    });
});

describe('analyzeAllocation', () => {
    it('counts tuples, allocations and realizations', () => {
        const allocatedTarget = findTarget(true);
        const skippedTarget = findTarget(false);
        const train = [row({ target_id: allocatedTarget }), row({ target_id: skippedTarget })];
        const val = [row({ target_id: allocatedTarget })];

        const stats = analyzeAllocation(train, val, DEFAULT_VAL_RATIO);
        expect(stats.tuples).toBe(2);
        expect(stats.allocated).toBe(1);
        expect(stats.realized).toBe(1);
        expect(stats.unrealized).toEqual([]);
    });

    it('reports allocated tuples that produced no validation sample', () => {
        const allocatedTarget = findTarget(true);
        const train = [row({ target_id: allocatedTarget })];

        const stats = analyzeAllocation(train, [], DEFAULT_VAL_RATIO);
        expect(stats.allocated).toBe(1);
        expect(stats.realized).toBe(0);
        expect(stats.unrealized).toEqual([`${allocatedTarget}#gen#view-a`]);
    });

    it('counts a tuple once regardless of how many rows it produced', () => {
        const train = [
            row({ mode: 'question' }),
            row({ mode: 'solution' }),
        ];
        expect(analyzeAllocation(train, [], DEFAULT_VAL_RATIO).tuples).toBe(1);
    });
});

describe('analyzeViewCoverage', () => {
    it('sorts worst-covered first and separates unallocated from dropped views', () => {
        const allocatedTarget = findTarget(true);
        const train = [
            row({ view: 'view-a', target_id: allocatedTarget }),
            row({ view: 'view-b' }),
            row({ view: 'view-b' }),
        ];
        const val = [row({ view: 'view-b' })];

        const coverage = analyzeViewCoverage(train, val, DEFAULT_VAL_RATIO);
        expect(coverage.map(c => c.view)).toEqual(['view-a', 'view-b']);
        // view-a had an allocated tuple yet produced nothing — a silent drop,
        // distinct from a view no tuple was ever allocated for.
        expect(coverage[0]).toMatchObject({ view: 'view-a', valRows: 0, allocatedTuples: 1, trainRows: 1 });
        expect(coverage[1]).toMatchObject({ view: 'view-b', valRows: 1, trainRows: 2 });
    });
});

describe('analyzeLabelCoverage', () => {
    it('ranks labels with no validation mass first', () => {
        const train = [
            row({ tags: ['Addition', 'Counting'] }),
            row({ tags: ['Addition'] }),
        ];
        const val = [row({ tags: ['Addition'] })];

        const coverage = analyzeLabelCoverage(train, val);
        expect(coverage[0]).toEqual({ label: 'Counting', trainRows: 1, valRows: 0 });
        expect(coverage[1]).toEqual({ label: 'Addition', trainRows: 2, valRows: 1 });
    });

    it('tolerates rows without tags', () => {
        expect(analyzeLabelCoverage([row()], [])).toEqual([]);
    });
});

describe('buildSplitIntegrityReport', () => {
    it('reports a clean split without errors', () => {
        const train = [row({ content_fingerprint: 'fp-1', tags: ['Addition'] })];
        const val = [row({ content_fingerprint: 'fp-2', target_id: 't2', tags: ['Addition'] })];

        const report = buildSplitIntegrityReport(train, val, DEFAULT_VAL_RATIO);
        expect(report.hasErrors).toBe(false);
        expect(report.trainRows).toBe(1);
        expect(report.valRows).toBe(1);
        expect(report.valShare).toBe(0.5);
    });

    it('flags errors for leakage and for redundancy independently', () => {
        const leaked = buildSplitIntegrityReport(
            [row({ content_fingerprint: 'fp-1' })],
            [row({ content_fingerprint: 'fp-1', target_id: 't2' })],
            DEFAULT_VAL_RATIO
        );
        expect(leaked.hasErrors).toBe(true);
        expect(leaked.leaks).toHaveLength(1);

        const redundant = buildSplitIntegrityReport(
            [row({ content_fingerprint: 'fp-1' }), row({ content_fingerprint: 'fp-1', target_id: 't2' })],
            [row({ content_fingerprint: 'fp-2', target_id: 't3' })],
            DEFAULT_VAL_RATIO
        );
        expect(redundant.hasErrors).toBe(true);
        expect(redundant.leaks).toEqual([]);
        expect(redundant.redundancy).toHaveLength(1);
    });

    it('handles an empty validation split without dividing by zero', () => {
        const report = buildSplitIntegrityReport([row()], [], DEFAULT_VAL_RATIO);
        expect(report.valShare).toBe(0);
        expect(report.hasErrors).toBe(false);
    });
});
