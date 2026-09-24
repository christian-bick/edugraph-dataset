import { describe, expect, it } from 'vitest';
import { Area } from 'edugraph-ts';
import {
    createMatchingSnapshot,
    diffMatchingSnapshots,
    MATCHING_SNAPSHOT_SCHEMA_VERSION,
    MatchingSnapshot,
    renderMatchingDiffMarkdown
} from './matching-diff.ts';

describe('matching diff', () => {
    const generators = [
        { generatorId: 'g1', labels: [Area.Addition], problemType: 'ArithmeticPairProblem' as const },
        { generatorId: 'g2', labels: [Area.Subtraction], problemType: 'ArithmeticPairProblem' as const }
    ];
    const views = [
        { viewId: 'v1', supportedLabels: [Area.Addition], problemType: 'ArithmeticPairProblem' as const },
        { viewId: 'v2', supportedLabels: [Area.Subtraction], problemType: 'ArithmeticPairProblem' as const }
    ];

    it('captures sorted semantic pairs per target', () => {
        const snapshot = createMatchingSnapshot('demo', [{
            target: { id: 't1', labels: [Area.Addition] },
            disposition: 'spec'
        }], generators, views);
        expect(snapshot.targets.t1.pairs).toEqual(['g1#v1', 'g1#v2', 'g2#v1']);
    });

    it('reports target and pair additions and removals', () => {
        const snapshot = (targets: MatchingSnapshot['targets']): MatchingSnapshot => ({
            schema_version: MATCHING_SNAPSHOT_SCHEMA_VERSION,
            spec: 'demo',
            targets
        });
        const before = snapshot({
            t1: { disposition: 'spec', labels: [Area.Addition], pairs: ['g1#v1'], planHashes: {'g1#v1': 'before'} }
        });
        const after = snapshot({
            t2: { disposition: 'implementationTodo', labels: [Area.Subtraction], pairs: ['g2#v2'], planHashes: {'g2#v2': 'after'} }
        });
        const diff = diffMatchingSnapshots(before, after);
        expect(diff.addedTargets).toEqual(['t2']);
        expect(diff.removedTargets).toEqual(['t1']);
        expect(diff.addedPairs).toEqual(['t2 -> g2#v2']);
        expect(diff.removedPairs).toEqual(['t1 -> g1#v1']);
        expect(renderMatchingDiffMarkdown(before, after, diff)).toContain('Targets: 1 → 1');
    });

    it('refuses to compare different specs', () => {
        const before = createMatchingSnapshot('before', [], generators, views);
        const after = createMatchingSnapshot('after', [], generators, views);
        expect(() => diffMatchingSnapshots(before, after)).toThrow(/Cannot compare/);
    });

    it('reports promotion from an implementation TODO into the active spec', () => {
        const base = {
            schema_version: MATCHING_SNAPSHOT_SCHEMA_VERSION,
            spec: 'demo',
            targets: {
                t1: { disposition: 'implementationTodo' as const, labels: [Area.Addition], pairs: [], planHashes: {} }
            }
        };
        const current = {
            ...base,
            targets: {
                t1: { disposition: 'spec' as const, labels: [Area.Addition], pairs: ['g1#v1'], planHashes: {'g1#v1': 'plan'} }
            }
        };
        const diff = diffMatchingSnapshots(base, current);
        expect(diff.changedDispositions).toEqual(['t1']);
        expect(renderMatchingDiffMarkdown(base, current, diff)).toContain('implementationTodo → spec');
    });

    it('reports admissible-space changes even when all matching pairs remain', () => {
        const before = createMatchingSnapshot('demo', [{target: {id: 't', labels: [Area.Addition]}, disposition: 'spec'}], generators, views);
        const after = structuredClone(before);
        after.targets.t.planHashes['g1#v1'] = 'changed-admissible-space';
        const diff = diffMatchingSnapshots(before, after);
        expect(diff.addedPairs).toEqual([]);
        expect(diff.removedPairs).toEqual([]);
        expect(diff.changedPlans).toEqual(['t -> g1#v1']);
        expect(renderMatchingDiffMarkdown(before, after, diff)).toContain('Changed generation plans (1)');
    });

    it('requires regeneration of legacy snapshots without plan identities', () => {
        const current = createMatchingSnapshot('demo', [], generators, views);
        expect(() => diffMatchingSnapshots({...current, schema_version: 1}, current)).toThrow('Unsupported matching snapshot schema');
    });
});
