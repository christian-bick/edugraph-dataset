import {describe, expect, it} from 'vitest';
import {resolveGraphExecutionMode} from './graph-execution-mode.ts';
import {createDependencyGraphSnapshot, planDependencyDelta} from './dependency-planner.ts';

const previous = {graph: 'prior'};

describe('graph execution mode', () => {
    it('keeps the previous graph for normal incremental work', () => {
        expect(resolveGraphExecutionMode({
            previous,
            previousExternalIdentity: 'ontology-v1',
            rebuild: false,
            currentExternalIdentity: 'ontology-v1'
        })).toMatchObject({
            reconstruct: false,
            comparison: previous,
            incremental: previous,
            externalIdentityChanged: false,
            baselineReset: false
        });
    });

    it('reconstructs and compares for explicit rebuild and external provenance changes', () => {
        for (const mode of [
            resolveGraphExecutionMode({
                previous,
                previousExternalIdentity: 'ontology-v1',
                rebuild: true,
                currentExternalIdentity: 'ontology-v1'
            }),
            resolveGraphExecutionMode({
                previous,
                previousExternalIdentity: 'ontology-v1',
                rebuild: false,
                currentExternalIdentity: 'ontology-v2'
            })
        ]) {
            expect(mode.reconstruct).toBe(true);
            expect(mode.comparison).toBe(previous);
            expect(mode.incremental).toBeNull();
        }
    });

    it('resets only when explicitly requested', () => {
        expect(resolveGraphExecutionMode({
            previous,
            previousExternalIdentity: 'ontology-v1',
            rebuild: false,
            reset: true,
            currentExternalIdentity: 'ontology-v1'
        })).toMatchObject({
            reconstruct: true,
            comparison: null,
            incremental: null,
            baselineReset: true
        });
    });

    it('automatically resets an unsupported prior baseline', () => {
        expect(resolveGraphExecutionMode({
            previous,
            previousSupported: false,
            previousExternalIdentity: 'ontology-v1',
            rebuild: false,
            currentExternalIdentity: 'ontology-v1'
        })).toMatchObject({
            reconstruct: true,
            comparison: null,
            incremental: null,
            baselineReset: true
        });
    });

    it('rejects contradictory explicit modes', () => {
        expect(() => resolveGraphExecutionMode({
            previous,
            previousExternalIdentity: 'ontology-v1',
            rebuild: true,
            reset: true,
            currentExternalIdentity: 'ontology-v1'
        })).toThrow('mutually exclusive');
    });

    it('makes rebuild local and reset global when passed to the shared planner', () => {
        const graph = (sourceHash: string) => createDependencyGraphSnapshot([
            {id: 'source:changed', kind: 'source-file', input_hash: sourceHash, dependencies: []},
            {id: 'pair:affected', kind: 'generation-pair', input_hash: 'pair', dependencies: ['source:changed']},
            {id: 'pair:reusable', kind: 'generation-pair', input_hash: 'stable', dependencies: []}
        ]);
        const prior = graph('before');
        const current = graph('after');
        const rebuild = planDependencyDelta(prior, current);
        const reset = planDependencyDelta(null, current);

        expect(rebuild.affected_nodes).toEqual(['pair:affected', 'source:changed']);
        expect(rebuild.reuse_nodes).toContain('pair:reusable');
        expect(reset.affected_nodes).toEqual([
            'pair:affected',
            'pair:reusable',
            'source:changed'
        ]);
        expect(reset.reuse_nodes).toEqual([]);
    });
});
