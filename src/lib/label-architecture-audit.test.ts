import {describe, expect, it} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {
    buildLabelArchitectureAudit,
    labelDimension,
    reuseAuditTuplesFromGraph,
    scanImplementationSource
} from './label-architecture-audit.ts';
import {createDependencyGraphSnapshot, type DependencyNode} from './dependency-planner.ts';
import type {GeneratorModelDescriptor, ViewModelDescriptor} from './model-catalog.ts';
import {
    buildCompatibleModulePairIndex,
    buildDependencyMatchingIndex,
    generatorCapabilityInputHash,
    generatorCapabilityNodeId,
    matchingPolicyInputHash,
    matchingPolicyNodeId,
    matchTupleNodeId,
    modulePairKey,
    modulePairNodeId,
    targetCapabilityInputHash,
    targetCapabilityNodeId,
    viewCapabilityInputHash,
    viewCapabilityNodeId,
    type MatchTuple
} from './matching.ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';
import {createWorkCounters} from './work-counters.ts';

const target: CompetencyTarget = {
    id: 'target-one',
    labels: [Area.Addition, Ability.ProcedureExecution]
};

const generator: GeneratorModelDescriptor = {
    generatorId: 'generator-one',
    labels: [Area.Addition],
    problemType: null,
    module: {
        id: 'generator-one',
        relativePath: 'generator-one',
        absolutePath: 'unused/generator-one',
        category: null
    },
    spec: {generatorId: 'generator-one', generalLabels: [Area.Addition]},
    schema: {}
};

const view: ViewModelDescriptor = {
    viewId: 'view-one',
    supportedLabels: [Ability.ProcedureExecution],
    requiredLabels: [],
    rejectedLabels: [],
    problemType: null,
    module: {
        id: 'view-one',
        relativePath: 'view-one',
        absolutePath: 'unused/view-one',
        category: null
    },
    spec: {viewId: 'view-one', generalLabels: [Ability.ProcedureExecution]},
    schema: {}
};

function currentGraph() {
    const tuple: MatchTuple = {
        target,
        generatorId: generator.generatorId,
        viewId: view.viewId
    };
    const targetNode = targetCapabilityNodeId('test-spec', target.id);
    const generatorNode = generatorCapabilityNodeId(generator.generatorId);
    const viewNode = viewCapabilityNodeId(view.viewId);
    const pairNode = modulePairNodeId(generator.generatorId, view.viewId);
    const nodes: DependencyNode[] = [
        {
            id: matchingPolicyNodeId(),
            kind: 'matching-policy',
            input_hash: matchingPolicyInputHash(),
            dependencies: []
        },
        {
            id: targetNode,
            kind: 'target-capability',
            input_hash: targetCapabilityInputHash(target),
            dependencies: []
        },
        {
            id: generatorNode,
            kind: 'generator-capability',
            input_hash: generatorCapabilityInputHash(generator),
            dependencies: []
        },
        {
            id: viewNode,
            kind: 'view-capability',
            input_hash: viewCapabilityInputHash(view),
            dependencies: []
        },
        {
            id: pairNode,
            kind: 'module-pair',
            input_hash: 'pair',
            dependencies: [matchingPolicyNodeId(), generatorNode, viewNode]
        },
        {
            id: matchTupleNodeId(
                'test-spec', target.id, generator.generatorId, view.viewId
            ),
            kind: 'match-tuple',
            input_hash: 'matched',
            dependencies: [targetNode, pairNode]
        }
    ];
    return createDependencyGraphSnapshot(nodes, undefined, buildDependencyMatchingIndex(
        [target],
        [tuple]
    ));
}

describe('label architecture audit', () => {
    it('classifies ontology dimensions', () => {
        expect(labelDimension(Area.Addition)).toBe('Area');
        expect(labelDimension(Ability.ProcedureExecution)).toBe('Ability');
        expect(labelDimension('https://example.test/standard')).toBe('Other');
    });

    it('reports raw label access and learner-action payload fields as source signals', () => {
        const signals = scanImplementationSource({
            role: 'generator',
            moduleId: 'example',
            file: 'src/generators/example/generator.ts',
            content: [
                'const chosen = payload.labels.includes(label);',
                'return {answer: 4, prompt: "Solve", unknownRole: "left"};'
            ].join('\n')
        });
        expect(signals.map(signal => [signal.kind, signal.value])).toEqual([
            ['payload-field-candidate', 'prompt'],
            ['payload-field-candidate', 'unknownRole'],
            ['raw-label-access', 'payload.labels']
        ]);
        expect(signals.every(signal => signal.line > 0)).toBe(true);
    });

    it('reuses exact successful tuples from a current dependency graph', () => {
        const pairIndex = buildCompatibleModulePairIndex([generator], [view]);
        const result = reuseAuditTuplesFromGraph({
            specName: 'test-spec',
            targets: [target],
            generators: [generator],
            views: [view],
            pairIndex,
            graph: currentGraph()
        });
        expect(result.reason).toContain('match the persisted graph');
        expect(result.tuples).toEqual([{
            target,
            generatorId: generator.generatorId,
            viewId: view.viewId
        }]);
    });

    it('falls back when a current capability differs from the graph', () => {
        const changedView = {
            ...view,
            supportedLabels: [Ability.ProcedureExecution, Ability.Interpretation]
        };
        const result = reuseAuditTuplesFromGraph({
            specName: 'test-spec',
            targets: [target],
            generators: [generator],
            views: [changedView],
            pairIndex: buildCompatibleModulePairIndex([generator], [changedView]),
            graph: currentGraph()
        });
        expect(result.tuples).toBeNull();
        expect(result.reason).toContain('view capability changed');
    });

    it('records exact provider provenance without inventing findings', () => {
        const report = buildLabelArchitectureAudit({
            projectRoot: '.',
            specName: 'test-spec',
            targets: [target],
            generators: [generator],
            views: [view],
            graph: currentGraph(),
            sourceSignals: []
        });
        expect(report.matching.source).toBe('persisted-graph');
        expect(report.capability_provenance).toEqual([
            expect.objectContaining({
                target_label: Area.Addition,
                providers: [expect.objectContaining({role: 'generator', declaration: 'generalLabels'})]
            }),
            expect.objectContaining({
                target_label: Ability.ProcedureExecution,
                providers: [expect.objectContaining({role: 'view', declaration: 'generalLabels'})]
            })
        ]);
        expect(report.findings).toEqual([]);
        expect(report.matching.matched_tuples).toBe(1);
        expect(report.module_inventory.ability_parameterized_views).toEqual([]);
        expect(modulePairKey(generator.generatorId, view.viewId)).toBe('generator-one#view-one');
    });

    it('keeps tuple matching, indexing, and provenance work linear in target count', () => {
        const run = (count: number) => {
            const counters = createWorkCounters();
            const targets = Array.from({length: count}, (_, index) => ({
                ...target,
                id: `target-${index}`
            }));
            buildLabelArchitectureAudit({
                projectRoot: '.',
                specName: 'test-spec',
                targets,
                generators: [generator],
                views: [view],
                graph: null,
                sourceSignals: [],
                counters
            });
            return counters;
        };
        const small = run(10);
        const large = run(20);
        for (const counter of [
            'match.targets',
            'match.capability_checks',
            'label_audit.tuple_index_entries',
            'label_audit.tuple_label_lookups',
            'label_audit.provenance_provider_entries'
        ]) {
            expect(large.get(counter)).toBe(small.get(counter) * 2);
        }
    });
});
