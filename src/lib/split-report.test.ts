import { describe, it, expect } from 'vitest';
import {Area} from 'edugraph-ts';
import { MetadataRow } from './dataset-merge.ts';
import { isValTuple, DEFAULT_VAL_RATIO, computeSampleSeed } from './generation.ts';
import {CompatibilityContractError, planCompatibility, sampleGenerationPlan} from './compatibility.ts';
import type {CompatibilityPlanningInput, GenerationPlan} from '../types/compatibility.ts';
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
        task_fingerprint: overrides.task_fingerprint ?? overrides.content_fingerprint ?? 'task-0',
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

function plan(targetId: string, overrides: Partial<CompatibilityPlanningInput> = {}): GenerationPlan {
    const result = planCompatibility({identity: {targetId, generatorId: 'gen', viewId: 'view-a'},
        targetLabels: [], generatorLabels: [], viewLabels: [], fields: [], ...overrides});
    if (!result.supported) throw new Error('Invalid split-report fixture');
    return result.plan;
}

function plannedRow(plan: GenerationPlan, split: 'train' | 'val', fingerprint: string): MetadataRow {
    const sampleKey = `${plan.identity.targetId}#gen#view-a#${split}#question#inst:0`;
    return row({target_id: plan.identity.targetId, sample_key: sampleKey, content_fingerprint: fingerprint,
        generation_plan: plan, generation_plan_hash: plan.hash, labels: ['Addition'],
        generation_replay: {version: 1, sampleKey, attempt: 1, seed: computeSampleSeed(sampleKey, 1),
            selection: sampleGenerationPlan(plan, () => 0)}});
}

function associate(row: MetadataRow, targetPlan: GenerationPlan) {
    row.target_associations = [{spec: row.spec, target_id: targetPlan.identity.targetId,
        generation_plan: targetPlan, generation_plan_hash: targetPlan.hash,
        selection: sampleGenerationPlan(targetPlan, () => 0)}];
    return row;
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

    it('includes matched tuples missing from both splits, even when no rows were emitted', () => {
        const missing = plan(findTarget(true));
        const report = buildSplitIntegrityReport([], [], DEFAULT_VAL_RATIO, {plans: [missing]});
        const key = `${missing.identity.targetId}#gen#view-a`;
        expect(report.allocation).toMatchObject({denominator: 'matched', tuples: 1, allocated: 1,
            realized: 0, trainRepresented: 0, missingTrain: [key], missingEverywhere: [key], unrealized: [key]});
        expect(report.viewCoverage).toEqual([{view: 'view-a', trainRows: 0, valRows: 0, allocatedTuples: 1}]);
        expect(report.hasErrors).toBe(false);
    });

    it('counts receipt-backed association-only coverage without adding physical images or label mass', () => {
        const first = plan('first');
        const second = plan('second');
        const train = associate(plannedRow(first, 'train', 'train-content'), second);
        const val = associate(plannedRow(second, 'val', 'val-content'), first);
        const report = buildSplitIntegrityReport([train], [val], 1, {plans: [first, second]});
        expect(report.allocation).toEqual({denominator: 'matched', tuples: 2, allocated: 2, realized: 2,
            primaryTrainTuples: 1, primaryValTuples: 1, trainRepresented: 2,
            missingTrain: [], missingEverywhere: [], unrealized: []});
        expect(report).toMatchObject({trainRows: 1, valRows: 1, valShare: 0.5, hasErrors: false});
        expect(report.labelCoverage).toEqual([{label: 'Addition', trainRows: 1, valRows: 1}]);
        expect(report.viewCoverage).toEqual([{view: 'view-a', trainRows: 1, valRows: 1, allocatedTuples: 2}]);
        expect(analyzeViewCoverage([train], [val], 1, {plans: [first, second]})).toEqual(report.viewCoverage);
        expect(analyzeAllocation([train], [val], 1).denominator).toBe('observed');
    });

    it('does not count a valid association receipt for a different actual choice', () => {
        const fields: CompatibilityPlanningInput['fields'] = [{owner: 'generator', field: 'kind',
            alternatives: [{id: 'off', labels: []}, {id: 'on', labels: ['enabled']}]}];
        const first = plan('first', {fields});
        const second = plan('second', {fields});
        const source = associate(plannedRow(first, 'train', 'content'), second);
        source.target_associations![0].selection = sampleGenerationPlan(second, () => 0.999);
        expect(() => analyzeAllocation([source], [], 1, {plans: [first, second]}))
            .toThrow(/does not admit the actual sample selection/);
    });

    it('requires the retained row annotations to support an associated target', () => {
        const first = plan('first', {generatorLabels: [Area.Addition]});
        const second = plan('second', {generatorLabels: [Area.Addition], targetLabels: [Area.Addition]});
        const source = associate(plannedRow(first, 'train', 'content'), second);
        expect(analyzeAllocation([source], [], 1, {plans: [first, second]}).trainRepresented).toBe(2);
        source.labels = [];
        expect(() => analyzeAllocation([source], [], 1, {plans: [first, second]}))
            .toThrow(/Published labels do not cover associated target/);
    });

    it('refuses stale association plans and tuples absent from the authoritative snapshot', () => {
        const first = plan('first');
        const second = plan('second');
        const source = associate(plannedRow(first, 'train', 'content'), second);
        expect(() => analyzeAllocation([source], [], 1, {plans: [first]}))
            .toThrow(/Association plan disagrees/);
        expect(() => analyzeAllocation([source], [], 1, {plans: [second]}))
            .toThrow(/absent from the snapshot matching plans/);
        source.target_associations![0].generation_plan_hash = 'stale';
        expect(() => analyzeAllocation([source], [], 1, {plans: [first, second]}))
            .toThrow(CompatibilityContractError);
    });

    it('refuses a recorded source plan that disagrees with the snapshot', () => {
        const first = plan('first');
        const second = plan('second');
        const source = associate(plannedRow(first, 'train', 'content'), second);
        const changedFirst = plan('first', {inputHash: 'changed-source'});
        expect(() => analyzeAllocation([source], [], 1, {plans: [changedFirst, second]}))
            .toThrow(/Sample plan disagrees/);
        expect(() => analyzeAllocation([], [], 1, {plans: [first, changedFirst]}))
            .toThrow(/Conflicting allocation plans/);
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
            row({ labels: ['Addition', 'Counting'] }),
            row({ labels: ['Addition'] }),
        ];
        const val = [row({ labels: ['Addition'] })];

        const coverage = analyzeLabelCoverage(train, val);
        expect(coverage[0]).toEqual({ label: 'Counting', trainRows: 1, valRows: 0 });
        expect(coverage[1]).toEqual({ label: 'Addition', trainRows: 2, valRows: 1 });
    });

    it('tolerates rows without labels', () => {
        expect(analyzeLabelCoverage([row()], [])).toEqual([]);
    });
});

describe('buildSplitIntegrityReport', () => {
    it('reports a clean split without errors', () => {
        const train = [row({ content_fingerprint: 'fp-1', labels: ['Addition'] })];
        const val = [row({ content_fingerprint: 'fp-2', target_id: 't2', labels: ['Addition'] })];

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

    it('still detects training redundancy when the validation split is empty', () => {
        const report = buildSplitIntegrityReport([row({target_id: 'first'}), row({target_id: 'second'})], [], 1);
        expect(report.hasErrors).toBe(true);
        expect(report.redundancy).toHaveLength(1);
        expect(report.allocation.unrealized).toHaveLength(2);
    });
});
