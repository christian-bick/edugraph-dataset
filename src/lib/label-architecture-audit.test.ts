import {requireTargetLabels, rejectTargetLabels} from './compatibility.ts';
import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {
    buildLabelArchitectureAudit,
    labelDimension,
    reuseAuditTuplesFromGraph,
    scanImplementationSource
} from './label-architecture-audit.ts';
import {createDependencyGraphSnapshot, generationPlanDependencyHash, type DependencyNode} from './dependency-planner.ts';
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
    matchTargets,
    targetCapabilityInputHash,
    targetCapabilityNodeId,
    viewCapabilityInputHash,
    viewCapabilityNodeId
} from './matching.ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';
import {createWorkCounters} from './work-counters.ts';
import {inspectPositiveOwnership} from './spec-ownership.ts';
import {inspectApplicability} from './spec-contracts.ts';

const target: CompetencyTarget = {
    id: 'target-one',
    labels: [Area.Addition, Ability.ProcedureExecution]
};

const generator: GeneratorModelDescriptor = {
    generatorId: 'generator-one',
    generalLabels: [Area.Addition],
    labels: [Area.Addition],
    problemType: 'CountingProblem',
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
    generalLabels: [Ability.ProcedureExecution],
    supportedLabels: [Ability.ProcedureExecution],
    problemType: 'CountingProblem',
    module: {
        id: 'view-one',
        relativePath: 'view-one',
        absolutePath: 'unused/view-one',
        category: null
    },
    spec: {viewId: 'view-one', generalLabels: [Ability.ProcedureExecution]},
    schema: {}
};

function currentGraph(currentGenerator = generator, currentView = view) {
    const tuples = matchTargets([target], [currentGenerator], [currentView]).tuples;
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
            input_hash: generatorCapabilityInputHash(currentGenerator),
            dependencies: []
        },
        {
            id: viewNode,
            kind: 'view-capability',
            input_hash: viewCapabilityInputHash(currentView),
            dependencies: []
        },
        {
            id: pairNode,
            kind: 'module-pair',
            input_hash: 'pair',
            dependencies: [matchingPolicyNodeId(), generatorNode, viewNode]
        },
        ...tuples.map(tuple => ({
            id: matchTupleNodeId(
                'test-spec', target.id, generator.generatorId, view.viewId
            ),
            kind: 'match-tuple' as const,
            input_hash: generationPlanDependencyHash(tuple.plan),
            dependencies: [targetNode, pairNode]
        }))
    ];
    return createDependencyGraphSnapshot(nodes, undefined, buildDependencyMatchingIndex(
        [target],
        tuples
    ));
}

describe('label architecture audit', () => {
    it('rejects generator learner-task declarations even without any candidate target', () => {
        const invalidGenerator = {...generator, spec: {...generator.spec,
            compatibility: [requireTargetLabels('learner-task-dispatch', [Ability.Formalization])]}};
        expect(() => buildLabelArchitectureAudit({projectRoot: '.', specName: 'empty', targets: [],
            generators: [invalidGenerator], views: [], sourceSignals: []}))
            .toThrow(/cannot depend on learner Ability/);
    });

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
        expect(result.tuples).toEqual(matchTargets([target], [generator], [view]).tuples);
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

    it.each(['missing', 'corrupt', 'stale-input', 'stale-node'] as const)('rebuilds %s persisted generation plans', defect => {
        const graph = currentGraph();
        const pairKey = modulePairKey(generator.generatorId, view.viewId);
        const plans = graph.matching_index!.generation_plans_by_target[target.id];
        if (defect === 'missing') delete plans[pairKey];
        if (defect === 'corrupt') plans[pairKey] = {...plans[pairKey], hash: 'tampered'};
        if (defect === 'stale-input') plans[pairKey] = {...plans[pairKey], inputHash: 'stale'};
        if (defect === 'stale-node') graph.nodes[matchTupleNodeId('test-spec', target.id, generator.generatorId, view.viewId)].input_hash = 'matched';
        const result = reuseAuditTuplesFromGraph({specName: 'test-spec', targets: [target], generators: [generator],
            views: [view], pairIndex: buildCompatibleModulePairIndex([generator], [view]), graph});
        expect(result.tuples).toBeNull();
        expect(result.reason).toMatch(/generation plan/);
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

    it('uses identical D4 diagnostics with fresh matching and a reusable graph', () => {
        const modifiedGenerator = {...generator,
            generalLabels: [Area.Addition, Scope.ArabicNumerals],
            labels: [Area.Addition, Scope.ArabicNumerals],
            spec: {...generator.spec, generalLabels: [Area.Addition, Scope.ArabicNumerals]}};
        const modifiedView = {...view, schema: {notation: [Scope.ArabicNumerals]},
            supportedLabels: [...view.supportedLabels, Scope.ArabicNumerals]};
        const pairIndex = buildCompatibleModulePairIndex([modifiedGenerator], [modifiedView]);
        const expected = inspectPositiveOwnership({
            modules: [
                {role: 'generator', module_id: generator.generatorId,
                    generalLabels: modifiedGenerator.spec.generalLabels, schema: modifiedGenerator.schema},
                {role: 'view', module_id: view.viewId,
                    generalLabels: modifiedView.spec.generalLabels ?? [], schema: modifiedView.schema}
            ],
            pairs: pairIndex.orderedPairs.map(pair => ({generatorId: pair.generator.generatorId, viewId: pair.view.viewId}))
        });
        expect(expected).toHaveLength(1);
        for (const graph of [null, currentGraph(modifiedGenerator, modifiedView)]) {
            const report = buildLabelArchitectureAudit({projectRoot: '.', specName: 'test-spec', targets: [target],
                generators: [modifiedGenerator], views: [modifiedView], graph, sourceSignals: []});
            expect(report.matching.source).toBe(graph ? 'persisted-graph' : 'fresh-indexed-match');
            const findings = report.findings.filter(finding => finding.ownership);
            expect(findings.map(finding => finding.ownership)).toEqual(expected);
            expect(findings[0].affected_tuple_count).toBe(1);
            expect(findings[0].files.every(file => file.endsWith('/spec.ts'))).toBe(true);
        }
    });

    it('reports module ownership violations with declaration files when no target matches', () => {
        const generatorLabels = [Area.Addition, Area.Rectangle, Area.Square, Ability.Formalization];
        const viewLabels = [Ability.ProcedureExecution, Scope.ArabicNumerals];
        const report = buildLabelArchitectureAudit({projectRoot: '.', specName: 'test-spec', targets: [],
            generators: [{...generator, generalLabels: generatorLabels, labels: generatorLabels,
                spec: {...generator.spec, generalLabels: generatorLabels}, schema: {shape: [Area.Rectangle]}}],
            views: [{...view, generalLabels: viewLabels, supportedLabels: viewLabels,
                spec: {...view.spec, generalLabels: viewLabels}, schema: {notation: [Scope.ArabicNumerals]}}],
            graph: null, sourceSignals: []});
        const findings = report.findings.filter(finding => finding.ownership);
        expect(findings.map(finding => finding.category).sort()).toEqual([
            'generator-ability', 'redundant-general-labels',
            'schema-general-overlap', 'schema-general-overlap', 'schema-general-overlap'
        ]);
        for (const finding of findings) {
            expect(finding.disposition).toBe('violation');
            expect(finding.affected_tuple_count).toBe(0);
            expect(finding.files).toHaveLength(1);
            expect(finding.files[0]).toBe(`unused/${finding.modules[0]}/spec.ts`);
            expect(finding.ownership?.rule_ids.length).toBeGreaterThan(0);
        }
    });

    it('preserves identical applicability diagnostics across fresh matching and graph reuse', () => {
        const contradictoryView = {...view, compatibility: [requireTargetLabels('required', [Area.Addition]), rejectTargetLabels('rejected', [Area.Addition])]};
        const pairIndex = buildCompatibleModulePairIndex([generator], [contradictoryView]);
        const expected = inspectApplicability({views: [contradictoryView], pairIndex});
        // No target can match the contradiction. A current empty graph must not suppress the finding.
        const emptyGraph = createDependencyGraphSnapshot([
            ...Object.values(currentGraph(generator, contradictoryView).nodes).filter(node => node.kind !== 'match-tuple')
        ], undefined, buildDependencyMatchingIndex([target], []));
        for (const graph of [null, emptyGraph]) {
            const report = buildLabelArchitectureAudit({projectRoot: '.', specName: 'test-spec', targets: [target],
                generators: [generator], views: [contradictoryView], graph, sourceSignals: []});
            expect(report.matching.source).toBe(graph ? 'persisted-graph' : 'fresh-indexed-match');
            const findings = report.findings.filter(finding => finding.applicability);
            expect(findings.map(finding => finding.applicability)).toEqual(expected);
            expect(findings[0]).toMatchObject({disposition: 'violation', affected_tuple_count: 0,
                files: ['unused/view-one/spec.ts']});
            expect(report.findings.some(finding => finding.disposition === 'review')).toBe(true);
        }
    });

    it.each([true, false])('reports unsupported applicability with a generator present: %s', withGenerator => {
        const requiredView = {...view, compatibility: [requireTargetLabels('required', [Area.Square]), rejectTargetLabels('rejected', [Ability.Formalization])]};
        const generators = withGenerator ? [generator] : [];
        const report = buildLabelArchitectureAudit({projectRoot: '.', specName: 'test-spec', targets: [],
            generators, views: [requiredView], graph: null, sourceSignals: []});
        const findings = report.findings.filter(finding => finding.applicability);
        expect(findings.map(finding => finding.applicability)).toEqual(inspectApplicability({views: [requiredView],
            pairIndex: buildCompatibleModulePairIndex(generators, [requiredView])}));
        expect(findings).toHaveLength(2);
        expect(findings.every(finding => finding.files[0] === 'unused/view-one/spec.ts')).toBe(true);
        expect(findings.find(finding => finding.applicability?.kind !== 'ability-rejection')?.modules)
            .toEqual(withGenerator ? ['generator-one', 'view-one'] : ['view-one']);
    });
});
