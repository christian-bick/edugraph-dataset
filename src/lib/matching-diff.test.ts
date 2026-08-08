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
        { generatorId: 'g1', labels: [Area.Addition], problemType: 'arithmetic' as const },
        { generatorId: 'g2', labels: [Area.Subtraction], problemType: 'arithmetic' as const }
    ];
    const views = [
        { viewId: 'v1', supportedLabels: [Area.Addition], rejectedLabels: [], problemType: 'arithmetic' as const },
        { viewId: 'v2', supportedLabels: [Area.Subtraction], rejectedLabels: [], problemType: 'arithmetic' as const }
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
            t1: { disposition: 'spec', labels: [Area.Addition], pairs: ['g1#v1'] }
        });
        const after = snapshot({
            t2: { disposition: 'implementationTodo', labels: [Area.Subtraction], pairs: ['g2#v2'] }
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
                t1: { disposition: 'implementationTodo' as const, labels: [Area.Addition], pairs: [] }
            }
        };
        const current = {
            ...base,
            targets: {
                t1: { disposition: 'spec' as const, labels: [Area.Addition], pairs: ['g1#v1'] }
            }
        };
        const diff = diffMatchingSnapshots(base, current);
        expect(diff.changedDispositions).toEqual(['t1']);
        expect(renderMatchingDiffMarkdown(base, current, diff)).toContain('implementationTodo → spec');
    });
});
