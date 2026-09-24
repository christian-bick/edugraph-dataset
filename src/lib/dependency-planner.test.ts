import {describe, expect, it} from 'vitest';
import {digestIdentity} from './content-identity.ts';
import {planCompatibility} from './compatibility.ts';
import {
    DEPENDENCY_NODE_KINDS,
    DEPENDENCY_PLANNER_EPOCH,
    createDependencyGraphSnapshot,
    explainAffectedNode,
    planDependencyDelta,
    type DependencyGraphSnapshot,
    type DependencyNode,
    type DependencyNodeKind,
    type DependencyMatchingIndex
} from './dependency-planner.ts';

function node(
    id: string,
    kind: DependencyNodeKind,
    dependencies: string[] = [],
    input = id
): DependencyNode {
    return {
        id,
        kind,
        dependencies,
        input_hash: digestIdentity(input),
        output: {content_hash: digestIdentity(`output:${input}`)}
    };
}

function completeGraph(changed?: {id: string; input: string}): DependencyGraphSnapshot {
    const nodes = DEPENDENCY_NODE_KINDS.map((kind, index) => {
        const id = `${index}:${kind}`;
        return node(
            id,
            kind,
            index === 0 ? [] : [`${index - 1}:${DEPENDENCY_NODE_KINDS[index - 1]}`],
            changed?.id === id ? changed.input : id
        );
    });
    return createDependencyGraphSnapshot(nodes);
}

describe('dependency delta planning', () => {
    it.each(DEPENDENCY_NODE_KINDS)(
        'computes the complete reverse closure when %s changes',
        kind => {
            const index = DEPENDENCY_NODE_KINDS.indexOf(kind);
            const id = `${index}:${kind}`;
            const previous = completeGraph();
            const current = completeGraph({id, input: `${id}:changed`});
            const plan = planDependencyDelta(previous, current);
            const expected = DEPENDENCY_NODE_KINDS.slice(index)
                .map((nodeKind, offset) => `${index + offset}:${nodeKind}`);

            expect(plan.clean).toBe(false);
            expect(plan.changed_roots).toEqual([id]);
            expect(plan.affected_nodes).toEqual([...expected].sort());
            expect(plan.schedule).toEqual(expected);
            expect(plan.reuse_nodes).toHaveLength(index);
            expect(explainAffectedNode(plan, expected.at(-1)!)).toBe(expected.join(' -> '));
        }
    );

    it('uses previous edges to invalidate dependents of a removed node', () => {
        const previous = createDependencyGraphSnapshot([
            node('source', 'source-file'),
            node('generator', 'generator-module', ['source']),
            node('pair', 'generation-pair', ['generator'])
        ]);
        const current = createDependencyGraphSnapshot([
            node('generator', 'generator-module'),
            node('pair', 'generation-pair', ['generator'])
        ]);

        const plan = planDependencyDelta(previous, current);
        expect(plan.removed_nodes).toEqual(['source']);
        expect(plan.affected_nodes).toEqual(['generator', 'pair']);
        expect(explainAffectedNode(plan, 'pair')).toBe('source -> generator -> pair');
    });

    it('fails closed on a planner epoch change and reuses only unchanged outputs', () => {
        const previous = createDependencyGraphSnapshot([
            node('source', 'source-file'),
            node('view', 'view-module')
        ], DEPENDENCY_PLANNER_EPOCH - 1);
        const current = createDependencyGraphSnapshot([
            node('source', 'source-file'),
            node('view', 'view-module')
        ]);
        const clean = planDependencyDelta(previous, current);
        expect(clean.clean).toBe(true);
        expect(clean.rebuild_nodes).toEqual(['source', 'view']);
        expect(clean.reusable_outputs).toEqual({});

        const incremental = planDependencyDelta(current, createDependencyGraphSnapshot([
            node('source', 'source-file', [], 'changed'),
            node('view', 'view-module')
        ]));
        expect(incremental.reuse_nodes).toEqual(['view']);
        expect(incremental.reusable_outputs.view).toEqual(current.nodes.view.output);
    });

    it('produces the same deterministic outputs as a clean build for every change kind', () => {
        const evaluate = (
            graph: DependencyGraphSnapshot,
            reusable: Readonly<Record<string, string>> = {},
            schedule = planDependencyDelta(null, graph).schedule
        ): Record<string, string> => {
            const outputs: Record<string, string> = {...reusable};
            for (const id of schedule) {
                const current = graph.nodes[id];
                outputs[id] = digestIdentity({
                    input: current.input_hash,
                    dependencies: current.dependencies.map(dependency => outputs[dependency])
                });
            }
            return outputs;
        };
        const previousGraph = completeGraph();
        const previousOutputs = evaluate(previousGraph);

        for (let index = 0; index < DEPENDENCY_NODE_KINDS.length; index++) {
            const id = `${index}:${DEPENDENCY_NODE_KINDS[index]}`;
            const current = completeGraph({id, input: `${id}:changed`});
            const plan = planDependencyDelta(previousGraph, current);
            const reusable = Object.fromEntries(plan.reuse_nodes.map(nodeId => [nodeId, previousOutputs[nodeId]]));
            expect(evaluate(current, reusable, plan.schedule)).toEqual(evaluate(current));
        }
    });

    it('keeps measured planning work linear as a dependency chain grows', () => {
        const chain = (length: number, changed = false) => createDependencyGraphSnapshot(
            Array.from({length}, (_, index) => node(
                `node-${index.toString().padStart(4, '0')}`,
                index === 0 ? 'source-file' : 'coverage-record',
                index === 0 ? [] : [`node-${(index - 1).toString().padStart(4, '0')}`],
                index === 0 && changed ? 'changed' : `input-${index}`
            ))
        );
        const work = (length: number) => {
            const plan = planDependencyDelta(chain(length), chain(length, true));
            return Object.values(plan.work).reduce((sum, value) => sum + value, 0);
        };

        expect(work(400)).toBeLessThanOrEqual(work(200) * 2 + 10);
    });
});

describe('dependency graph contracts', () => {
    const planFor = (targetId: string, generatorId = 'g') => {
        const result = planCompatibility({identity: {targetId, generatorId, viewId: 'v'}, inputHash: 'inputs',
            targetLabels: [], generatorLabels: [], viewLabels: [], fields: []});
        if (!result.supported) throw new Error('Empty fixture plan must be supported');
        return result.plan;
    };

    it('persists canonical plans together with their matched pair references', () => {
        const index: DependencyMatchingIndex = {
            target_ids_by_label: {}, targets_without_ontology_labels: ['b', 'a'],
            matched_pair_keys_by_target: {b: ['g#v'], a: ['g#v']},
            generation_plans_by_target: {b: {'g#v': planFor('b')}, a: {'g#v': planFor('a')}}
        };
        const graph = createDependencyGraphSnapshot([], undefined, index);
        expect(Object.keys(graph.matching_index!.generation_plans_by_target)).toEqual(['a', 'b']);
        expect(JSON.parse(JSON.stringify(graph)).matching_index.generation_plans_by_target)
            .toEqual(graph.matching_index!.generation_plans_by_target);
    });

    it('rejects legacy, missing, corrupt, and misaddressed plans instead of creating bare matches', () => {
        const index: DependencyMatchingIndex = {target_ids_by_label: {}, targets_without_ontology_labels: [],
            matched_pair_keys_by_target: {a: ['g#v']}, generation_plans_by_target: {a: {'g#v': planFor('a')}}};
        const {generation_plans_by_target: _plans, ...legacy} = index;
        expect(() => createDependencyGraphSnapshot([], undefined, legacy as DependencyMatchingIndex)).toThrow('lacks generation plans');
        expect(() => createDependencyGraphSnapshot([], undefined, {...index, generation_plans_by_target: {}})).toThrow('differ from recorded pairs');
        expect(() => createDependencyGraphSnapshot([], undefined, {...index,
            generation_plans_by_target: {a: {'g#v': {...planFor('a'), hash: 'tampered'}}}})).toThrow('content hash mismatch');
        expect(() => createDependencyGraphSnapshot([], undefined, {...index,
            generation_plans_by_target: {a: {'g#v': planFor('b')}}})).toThrow('identity is invalid');
        expect(() => createDependencyGraphSnapshot([], undefined, {...index,
            generation_plans_by_target: {...index.generation_plans_by_target, b: {'g#v': planFor('b')}}})).toThrow('unreferenced');
    });

    it('rejects duplicate, missing, self, and unsupported node definitions', () => {
        expect(() => createDependencyGraphSnapshot([
            node('same', 'source-file'), node('same', 'view-module')
        ])).toThrow('Duplicate dependency node id');
        expect(() => createDependencyGraphSnapshot([
            node('view', 'view-module', ['missing'])
        ])).toThrow('references missing node');
        expect(() => createDependencyGraphSnapshot([
            node('view', 'view-module', ['view'])
        ])).toThrow('depends on itself');
        expect(() => createDependencyGraphSnapshot([
            {...node('bad', 'view-module'), kind: 'unknown' as DependencyNodeKind}
        ])).toThrow('Unsupported dependency node kind');
    });

    it('rejects a cycle in the affected schedule', () => {
        const cyclic = createDependencyGraphSnapshot([
            node('left', 'source-file', ['right']),
            node('right', 'view-module', ['left'])
        ]);
        expect(() => planDependencyDelta(null, cyclic)).toThrow('contains a cycle');
    });

});
