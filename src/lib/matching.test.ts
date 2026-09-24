import {requireTargetLabels, rejectTargetLabels} from './compatibility.ts';
import {describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {
    buildCompatibleModulePairIndex,
    buildDependencyMatchingIndex,
    buildTargetCapabilityPostingIndex,
    generatorCapabilityInputHash,
    matchTargets,
    matchTarget,
    diagnoseTargetMatches,
    findTargetsWithoutMatch,
    restorePersistedMatchTuple,
    generatorMatchingOntologyLabels,
    viewMatchingOntologyLabels,
    matchesTarget,
    matchTargetsDelta,
    matchingPolicyNodeId,
    matchTupleNodeId,
    modulePairNodeId,
    targetCapabilityInputHash,
    targetCapabilityNodeId,
    viewCapabilityInputHash,
    generatorCapabilityNodeId,
    viewCapabilityNodeId,
    type GeneratorMatchInfo,
    type MatchTuple,
    type ViewMatchInfo
} from './matching.ts';
import {
    createDependencyGraphSnapshot,
    type DependencyGraphSnapshot,
    type DependencyNode
} from './dependency-planner.ts';
import {digestIdentity} from './content-identity.ts';
import {createWorkCounters} from './work-counters.ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';
import {hasLabel, selectExactLabelMap} from './resolvers.ts';
import {withLabelChoices} from '../types/schema.ts';
import {MeasurementDataGeneratorSchema, spec as measurementGeneratorSpec} from '../generators/statistics/measurement-data/spec.ts';
import {MeasurementLinePlotViewSchema, spec as measurementViewSpec} from '../visuals/views/data/measurement-line-plot/spec.ts';
import {extractSchemaLabels} from './utils.ts';

const SPEC = 'test';
const POLICY = 'matching-policy-v1';

const targets = (): CompetencyTarget[] => [
    {
        id: 'execution',
        labels: [Area.Addition, Ability.ProcedureExecution]
    },
    {
        id: 'formalization',
        labels: [Area.Addition, Ability.Formalization]
    }
];

const generators = (): GeneratorMatchInfo[] => [{
    generatorId: 'addition',
    labels: [Area.Addition],
    problemType: 'ArithmeticPairProblem'
}];

const views = (): ViewMatchInfo[] => [
    {
        viewId: 'execution-view',
        supportedLabels: [Ability.ProcedureExecution],
        problemType: 'ArithmeticPairProblem'
    },
    {
        viewId: 'formalization-view',
        supportedLabels: [Ability.Formalization],
        problemType: 'ArithmeticPairProblem'
    }
];

const tupleIds = (tuples: readonly MatchTuple[]): string[] => tuples.map(tuple =>
    `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`
);

describe('required target labels', () => {
    it('selects a view only when the target requests its required Ability', () => {
        const view: ViewMatchInfo = {
            viewId: 'written-method', problemType: 'ArithmeticPairProblem',
            supportedLabels: [Ability.ProcedureUnderstanding, Ability.Formalization],
            compatibility: [requireTargetLabels('formalization-request', [Ability.Formalization])]
        };
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureUnderstanding],
            generators()[0]!,
            view
        )).toEqual({
            matched: false,
            reason: 'missing-required-label',
            label: Ability.Formalization
        });
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureUnderstanding, Ability.Formalization],
            generators()[0]!,
            view
        )).toEqual({matched: true});
    });

    it('accepts a target specialization of a required capability', () => {
        const view: ViewMatchInfo = {
            viewId: 'bounded-view', problemType: 'ArithmeticPairProblem',
            supportedLabels: [Ability.ProcedureExecution, Scope.NumbersSmaller10],
            compatibility: [requireTargetLabels('numeric-range-request', [Scope.NumericRange])]
        };
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureExecution, Scope.NumbersSmaller10],
            generators()[0]!,
            view
        )).toEqual({matched: true});
    });
});

describe('capability inheritance', () => {
    it('accepts a specialization for a broader target capability', () => {
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureUnderstanding],
            generators()[0]!,
            {viewId: 'inversion', problemType: 'ArithmeticPairProblem', supportedLabels: [Ability.ProcedureInversion]}
        )).toEqual({matched: true});
    });

    it('does not use structural partOf ancestry as capability inheritance', () => {
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureExecution, Scope.LengthMeasurement],
            generators()[0]!,
            {
                viewId: 'tapemeter', problemType: 'ArithmeticPairProblem',
                supportedLabels: [Ability.ProcedureExecution, Scope.Tapemeter]
            }
        )).toEqual({
            matched: false,
            reason: 'unsupported-label',
            label: Scope.LengthMeasurement
        });
    });

    it('applies rejected boundaries to target specializations', () => {
        expect(matchesTarget(
            [Area.Addition, Ability.ProcedureExecution, Scope.NumbersSmaller10],
            generators()[0]!,
            {
                viewId: 'unbounded-only', problemType: 'ArithmeticPairProblem',
                supportedLabels: [Ability.ProcedureExecution, Scope.NumbersSmaller10],
                compatibility: [rejectTargetLabels('numeric-range-exclusion', [Scope.NumericRange])]
            }
        )).toEqual({
            matched: false,
            reason: 'rejected-label',
            label: Scope.NumericRange
        });
    });
});

describe('payload families', () => {
    it.each([{requiredLabels: []}, {requiredLabels: [Area.PatternGeneration]}])('never narrows a producer union through requirements $requiredLabels', ({requiredLabels}) => {
        const generator = {generatorId: 'family', labels: [Area.PatternGeneration], problemType: 'WritingProblem'};
        const view = {viewId: 'member', supportedLabels: [Ability.ProcedureExecution],
            compatibility: [requireTargetLabels('target-request', requiredLabels)], problemType: 'MultiDigitWritingProblem'};
        expect(buildCompatibleModulePairIndex([generator], [view]).orderedPairs).toEqual([]);
        expect(matchesTarget([Area.PatternGeneration, Ability.ProcedureExecution], generator, view))
            .toEqual({matched: false, reason: 'incompatible-type'});
    });

    it.each([null, undefined, 'UndeclaredProblem'])('fails closed for unresolved type %s on either role', problemType => {
        const generator = {...generators()[0], problemType};
        const view = {...views()[0], problemType};
        for (const [g, v] of [[generator, views()[0]], [generators()[0], view], [generator, view]] as const) {
            expect(matchesTarget(targets()[0].labels, g, v))
                .toEqual({matched: false, reason: 'incompatible-type'});
            expect(buildCompatibleModulePairIndex([g], [v]).orderedPairs).toEqual([]);
        }
    });

    it('keeps direct, indexed and delta matching aligned when a producer gains an unsupported member', () => {
        const target = {id: 'family', labels: [Area.Addition, Ability.ProcedureExecution]};
        const generator = {...generators()[0], problemType: 'ArithmeticPairProblem'};
        const view = {...views()[0], problemType: 'ArithmeticPairProblem'};
        const previousGraph = matchingGraph({targets: [target], generators: [generator], views: [view]});
        const broader = {...generator, problemType: 'ArithmeticProblem'};
        expect(matchesTarget(target.labels, broader, view)).toEqual({matched: false, reason: 'incompatible-type'});
        expect(matchTargets([target], [broader], [view]).tuples).toEqual([]);
        expect(delta({currentTargets: [target], currentGenerators: [broader],
            currentViews: [view], previousGraph}).tuples).toEqual([]);
    });
});

function matchingGraph(options: {
    targets: CompetencyTarget[];
    generators: GeneratorMatchInfo[];
    views: ViewMatchInfo[];
    policyHash?: string;
}): DependencyGraphSnapshot {
    const pairIndex = buildCompatibleModulePairIndex(options.generators, options.views);
    const tuples = matchTargets(
        options.targets,
        options.generators,
        options.views,
        {pairIndex}
    ).tuples;
    const nodes: DependencyNode[] = [{
        id: matchingPolicyNodeId(),
        kind: 'matching-policy',
        input_hash: options.policyHash ?? POLICY,
        dependencies: []
    }];
    for (const target of options.targets) nodes.push({
        id: targetCapabilityNodeId(SPEC, target.id),
        kind: 'target-capability',
        input_hash: targetCapabilityInputHash(target),
        dependencies: []
    });
    for (const generator of options.generators) nodes.push({
        id: generatorCapabilityNodeId(generator.generatorId),
        kind: 'generator-capability',
        input_hash: generatorCapabilityInputHash(generator),
        dependencies: []
    });
    for (const view of options.views) nodes.push({
        id: viewCapabilityNodeId(view.viewId),
        kind: 'view-capability',
        input_hash: viewCapabilityInputHash(view),
        dependencies: []
    });
    for (const pair of pairIndex.orderedPairs) nodes.push({
        id: modulePairNodeId(pair.generator.generatorId, pair.view.viewId),
        kind: 'module-pair',
        input_hash: digestIdentity({
            generator: pair.generator.generatorId,
            view: pair.view.viewId
        }),
        dependencies: [
            matchingPolicyNodeId(),
            generatorCapabilityNodeId(pair.generator.generatorId),
            viewCapabilityNodeId(pair.view.viewId)
        ]
    });
    for (const tuple of tuples) nodes.push({
        id: matchTupleNodeId(SPEC, tuple.target.id, tuple.generatorId, tuple.viewId),
        kind: 'match-tuple',
        input_hash: digestIdentity({matched: true}),
        dependencies: [
            targetCapabilityNodeId(SPEC, tuple.target.id),
            modulePairNodeId(tuple.generatorId, tuple.viewId)
        ]
    });
    return createDependencyGraphSnapshot(
        nodes,
        undefined,
        buildDependencyMatchingIndex(options.targets, tuples)
    );
}

function delta(options: {
    currentTargets?: CompetencyTarget[];
    currentGenerators?: GeneratorMatchInfo[];
    currentViews?: ViewMatchInfo[];
    previousGraph: DependencyGraphSnapshot | null;
    policyHash?: string;
}) {
    const currentTargets = options.currentTargets ?? targets();
    const currentGenerators = options.currentGenerators ?? generators();
    const currentViews = options.currentViews ?? views();
    return matchTargetsDelta({
        targets: currentTargets,
        generatorCatalog: currentGenerators,
        viewCatalog: currentViews,
        specName: SPEC,
        policyHash: options.policyHash ?? POLICY,
        previousGraph: options.previousGraph
    });
}

describe('delta target matching', () => {
    it.each([
        {required: Area.Square, rejected: Area.Rectangle, expected: []},
        {required: Area.Rectangle, rejected: Area.Square, expected: ['rectangle']}
    ])('agrees with direct matching after applicability changes: $required / $rejected', ({required, rejected, expected}) => {
        const currentTargets = [
            {id: 'rectangle', labels: [Area.Rectangle, Ability.ProcedureExecution]},
            {id: 'square', labels: [Area.Square, Ability.ProcedureExecution]}
        ];
        const currentGenerators = [{generatorId: 'shape', labels: [Area.Square], problemType: 'ArithmeticPairProblem'}];
        const originalView = {viewId: 'v', problemType: 'ArithmeticPairProblem', supportedLabels: [Ability.ProcedureExecution], compatibility: [requireTargetLabels('rectangle-request', [Area.Rectangle])]};
        const currentView = {...originalView, compatibility: [requireTargetLabels('required-request', [required]), rejectTargetLabels('excluded-request', [rejected])]};
        const previousGraph = matchingGraph({targets: currentTargets, generators: currentGenerators, views: [originalView]});
        const full = matchTargets(currentTargets, currentGenerators, [currentView]);
        const affected = delta({currentTargets, currentGenerators, currentViews: [currentView], previousGraph});
        expect(currentTargets.filter(target => matchesTarget(target.labels, currentGenerators[0], currentView).matched)
            .map(target => target.id)).toEqual(expected);
        expect(full.tuples.map(tuple => tuple.target.id)).toEqual(expected);
        expect(tupleIds(affected.tuples)).toEqual(tupleIds(full.tuples));
        expect(affected.baseline).toBe(false);
    });

    it('produces the full deterministic match set for a baseline', () => {
        const result = delta({previousGraph: null});
        const full = matchTargets(targets(), generators(), views());

        expect(result.baseline).toBe(true);
        expect(tupleIds(result.tuples)).toEqual(tupleIds(full.tuples));
        expect(result.reusedTuples).toBe(0);
        expect(result.evaluatedTargets).toBe(2);
        expect(result.evaluatedPairs).toBe(2);
    });

    it('reuses every successful tuple without reevaluating unchanged inputs', () => {
        const previousGraph = matchingGraph({
            targets: targets(), generators: generators(), views: views()
        });
        const result = delta({previousGraph});

        expect(tupleIds(result.tuples)).toEqual([
            'execution#addition#execution-view',
            'formalization#addition#formalization-view'
        ]);
        expect(result.baseline).toBe(false);
        expect(result.reusedTuples).toBe(2);
        expect(result.evaluatedTargets).toBe(0);
        expect(result.evaluatedPairs).toBe(0);
    });

    it('reevaluates only a changed target against the complete pair index', () => {
        const originalTargets = targets();
        const previousGraph = matchingGraph({
            targets: originalTargets, generators: generators(), views: views()
        });
        const currentTargets = [
            originalTargets[0],
            {
                ...originalTargets[1],
                labels: [Area.Addition, Ability.ProcedureExecution]
            }
        ];
        const result = delta({currentTargets, previousGraph});

        expect(tupleIds(result.tuples)).toEqual([
            'execution#addition#execution-view',
            'formalization#addition#execution-view'
        ]);
        expect(result.reusedTuples).toBe(1);
        expect(result.evaluatedTargets).toBe(1);
        expect(result.evaluatedPairs).toBe(0);
    });

    it('reevaluates a changed pair and discovers newly possible matches', () => {
        const originalViews = views();
        const currentTargets = [
            ...targets(),
            {id: 'unrelated', labels: [Area.CollectionSense]}
        ];
        const previousGraph = matchingGraph({
            targets: currentTargets, generators: generators(), views: originalViews
        });
        const currentViews = [
            originalViews[0],
            {
                ...originalViews[1],
                supportedLabels: [
                    Ability.ProcedureExecution,
                    Ability.Formalization
                ]
            }
        ];
        const result = delta({currentTargets, currentViews, previousGraph});
        const full = matchTargets(currentTargets, generators(), currentViews);

        expect(tupleIds(result.tuples)).toEqual(tupleIds(full.tuples));
        expect(tupleIds(result.tuples)).toContain(
            'execution#addition#formalization-view'
        );
        expect(result.reusedTuples).toBe(1);
        expect(result.evaluatedTargets).toBe(2);
        expect(result.evaluatedPairs).toBe(1);
    });

    it('drops tuples for removed pairs without reevaluating unaffected inputs', () => {
        const originalViews = views();
        const previousGraph = matchingGraph({
            targets: targets(), generators: generators(), views: originalViews
        });
        const result = delta({
            currentViews: [originalViews[0]],
            previousGraph
        });

        expect(tupleIds(result.tuples)).toEqual([
            'execution#addition#execution-view'
        ]);
        expect(result.reusedTuples).toBe(1);
        expect(result.evaluatedTargets).toBe(0);
        expect(result.evaluatedPairs).toBe(0);
    });

    it('fails closed to a complete match when the matching policy changes', () => {
        const previousGraph = matchingGraph({
            targets: targets(), generators: generators(), views: views()
        });
        const result = delta({
            previousGraph,
            policyHash: 'matching-policy-v2'
        });

        expect(result.baseline).toBe(true);
        expect(result.reusedTuples).toBe(0);
        expect(tupleIds(result.tuples)).toEqual(tupleIds(
            matchTargets(targets(), generators(), views()).tuples
        ));
    });

    it('keeps changed-pair matching work linear in target count', () => {
        const work = (targetCount: number) => {
            const repeatedTargets = Array.from({length: targetCount}, (_, index) => ({
                id: `target-${index}`,
                labels: [Area.Addition, Ability.ProcedureExecution]
            }));
            const originalViews = views();
            const previousGraph = matchingGraph({
                targets: repeatedTargets,
                generators: generators(),
                views: originalViews
            });
            const counters = createWorkCounters();
            const currentViews = [
                originalViews[0],
                {...originalViews[1], supportedLabels: [Ability.ProcedureExecution]}
            ];
            const result = matchTargetsDelta({
                targets: repeatedTargets,
                generatorCatalog: generators(),
                viewCatalog: currentViews,
                specName: SPEC,
                policyHash: POLICY,
                previousGraph,
                counters
            });
            return {
                evaluatedTargets: result.evaluatedTargets,
                capabilityChecks: counters.get('match.capability_checks')
            };
        };

        expect(work(32)).toEqual({evaluatedTargets: 32, capabilityChecks: 32});
        expect(work(64)).toEqual({evaluatedTargets: 64, capabilityChecks: 64});
    });

    it('uses target-side postings to skip targets unrelated to a changed pair', () => {
        const relevant = targets()[0];
        const unrelated = Array.from({length: 64}, (_, index) => ({
            id: `unrelated-${index}`,
            labels: [Area.CollectionSense]
        }));
        const currentTargets = [relevant, ...unrelated];
        const originalViews = views();
        const previousGraph = matchingGraph({
            targets: currentTargets,
            generators: generators(),
            views: originalViews
        });
        const currentViews = [
            originalViews[0],
            {...originalViews[1], supportedLabels: [Ability.ProcedureExecution]}
        ];
        const counters = createWorkCounters();
        const result = matchTargetsDelta({
            targets: currentTargets,
            generatorCatalog: generators(),
            viewCatalog: currentViews,
            specName: SPEC,
            policyHash: POLICY,
            previousGraph,
            targetIndex: buildTargetCapabilityPostingIndex(currentTargets, counters),
            counters
        });

        expect(result.evaluatedTargets).toBe(1);
        expect(counters.get('match.capability_checks')).toBe(1);
        expect(counters.get('match.delta_pair_candidate_targets')).toBe(1);
    });
});

describe('authoritative label plans in matching', () => {
    const generator: GeneratorMatchInfo = {
        generatorId: measurementGeneratorSpec.generatorId,
        labels: [...measurementGeneratorSpec.generalLabels, ...extractSchemaLabels(MeasurementDataGeneratorSchema)],
        generalLabels: measurementGeneratorSpec.generalLabels, schema: MeasurementDataGeneratorSchema,
        spec: measurementGeneratorSpec, problemType: 'MeasurementDataProblem', matchingSourceHash: 'generator-source'
    };
    const view: ViewMatchInfo = {
        viewId: measurementViewSpec.viewId,
        supportedLabels: [...measurementViewSpec.generalLabels, ...extractSchemaLabels(MeasurementLinePlotViewSchema)],
        generalLabels: measurementViewSpec.generalLabels, schema: MeasurementLinePlotViewSchema,
        spec: measurementViewSpec, problemType: 'MeasurementDataProblem', matchingSourceHash: 'view-source'
    };
    const requests = [
        {id: 'unit-steps', labels: [Area.Statistics, Scope.StepsOf1]},
        {id: 'single-frame', labels: [Area.Statistics, Scope.SingleFrameOfReference]},
        {id: 'fraction-steps', labels: [Area.Statistics, Scope.FractionNumbers, Scope.StepsOf1]},
        {id: 'single-frame-steps', labels: [Area.Statistics, Scope.SingleFrameOfReference, Scope.StepsOf1]}
    ];

    it('uses one planner for direct, indexed, diagnostic and unmatched-target routes', () => {
        const direct = requests.flatMap(target => {
            const verdict = matchTarget(target, generator, view);
            expect(matchesTarget(target.labels, generator, view).matched).toBe(verdict.matched);
            return verdict.matched ? [{target, generatorId: generator.generatorId, viewId: view.viewId, plan: verdict.plan}] : [];
        });
        const indexed = matchTargets(requests, [generator], [view]).tuples;
        const diagnostic = diagnoseTargetMatches(requests, [generator], [view]);
        expect(indexed).toEqual(direct);
        expect(diagnostic.tuples).toEqual(direct);
        expect(indexed.map(tuple => tuple.target.id)).toEqual(['unit-steps', 'single-frame']);
        expect(findTargetsWithoutMatch(requests, [generator], [view]).map(target => target.id)).toEqual(['fraction-steps', 'single-frame-steps']);
        expect(diagnostic.rejections.map(rejection => rejection.verdict.reason)).toEqual(['incompatible-label-variants', 'incompatible-label-variants']);
        expect(indexed[0].plan.domains.find(domain => domain.field === 'numberKind')?.alternatives.map(alternative => alternative.labels))
            .toEqual([[Scope.IntegerNumbers]]);
        expect(indexed[1].plan.domains.find(domain => domain.field === 'numberKind')?.alternatives.map(alternative => alternative.labels))
            .toEqual([[Scope.FractionNumbers]]);
    });

    it('restores byte-equivalent plans on the unchanged delta path', () => {
        const full = matchTargets(requests, [generator], [view]);
        const previousGraph = JSON.parse(JSON.stringify(matchingGraph({targets: requests, generators: [generator], views: [view]})));
        const reused = delta({currentTargets: requests, currentGenerators: [generator], currentViews: [view], previousGraph});
        expect(reused.tuples).toEqual(full.tuples);
        expect(reused.reusedTuples).toBe(2);
        expect(reused.evaluatedPairs).toBe(0);
        const stored = previousGraph.matching_index.generation_plans_by_target[requests[0].id]['measurement-data#measurement-line-plot'];
        expect(restorePersistedMatchTuple(requests[0], generator, view, stored)).toEqual(full.tuples[0]);
    });

    it('rebuilds legacy indexes but refuses stale or corrupt current-format plan records', () => {
        const previousGraph = matchingGraph({targets: requests, generators: [generator], views: [view]});
        const legacy = JSON.parse(JSON.stringify(previousGraph));
        delete legacy.matching_index.generation_plans_by_target;
        expect(delta({currentTargets: requests, currentGenerators: [generator], currentViews: [view], previousGraph: legacy}).baseline).toBe(true);
        const plan = matchTargets(requests, [generator], [view]).tuples[0].plan;
        expect(() => restorePersistedMatchTuple(requests[0], generator, view, undefined)).toThrow(/missing; rebuild matching/);
        expect(() => restorePersistedMatchTuple(requests[1], generator, view, plan)).toThrow(/identity mismatch/);
        expect(() => restorePersistedMatchTuple(requests[0], {...generator, matchingSourceHash: 'updated'}, view, plan)).toThrow(/inputs changed/);
        expect(() => restorePersistedMatchTuple(requests[0], generator, view, {...plan, hash: 'changed'})).toThrow(/hash mismatch/);
        const missing = JSON.parse(JSON.stringify(previousGraph));
        delete missing.matching_index.generation_plans_by_target[requests[0].id]['measurement-data#measurement-line-plot'];
        expect(() => delta({currentTargets: requests, currentGenerators: [generator], currentViews: [view], previousGraph: missing})).toThrow(/missing; rebuild matching/);
    });

    it('discovers newly admitted targets when only an imported rule helper changes', () => {
        let enabled = false;
        const predicate = vi.fn(() => enabled);
        const changing: ViewMatchInfo = {...view, spec: {...measurementViewSpec, compatibility: [{id: 'helper-policy', dependencies: [], predicate}]}, matchingSourceHash: 'helper-before'};
        const independent = {...view, viewId: 'unchanged', spec: {...measurementViewSpec, viewId: 'unchanged'}};
        const target = requests[0];
        const previousGraph = matchingGraph({targets: [target], generators: [generator], views: [changing, independent]});
        expect(previousGraph.matching_index?.matched_pair_keys_by_target[target.id]).toEqual(['measurement-data#unchanged']);
        enabled = true;
        predicate.mockClear();
        const currentView = {...changing, matchingSourceHash: 'helper-after'};
        const result = delta({currentTargets: [target], currentGenerators: [generator], currentViews: [currentView, independent], previousGraph});
        expect(result.reusedTuples).toBe(1);
        expect(result.tuples.map(tuple => tuple.viewId)).toEqual([view.viewId, 'unchanged']);
        expect(predicate).toHaveBeenCalledOnce();
        expect(result.tuples).toEqual(matchTargets([target], [generator], [currentView, independent]).tuples);
    });

    it('changes input identity for rules, schemas, defaults and declared semantic reads', () => {
        const base: GeneratorMatchInfo = {generatorId: 'g', labels: [Scope.IntegerNumbers, Scope.FractionNumbers], generalLabels: [], problemType: 'MeasurementDataProblem',
            schema: {kind: [[Scope.IntegerNumbers, Scope.FractionNumbers], selectExactLabelMap([[Scope.IntegerNumbers, 'integer'], [Scope.FractionNumbers, 'fraction']])]}};
        const withRule = {...base, compatibility: [{id: 'integer', dependencies: [{scope: 'generator' as const, label: Scope.IntegerNumbers}], predicate: () => true}]};
        expect(generatorCapabilityInputHash(withRule)).not.toBe(generatorCapabilityInputHash(base));
        expect(generatorCapabilityInputHash({...withRule, compatibility: [{...withRule.compatibility[0], predicate: () => false}]})).not.toBe(generatorCapabilityInputHash(withRule));
        expect(generatorCapabilityInputHash({...base, matchingSourceHash: 'helper-1'})).not.toBe(generatorCapabilityInputHash({...base, matchingSourceHash: 'helper-2'}));
        const defaultResolver = withLabelChoices(selectExactLabelMap([[Scope.IntegerNumbers, 'integer'], [Scope.FractionNumbers, 'fraction']]), {
            kind: 'alternatives', defaults: [{whenAll: [Scope.SingleFrameOfReference], labels: [Scope.FractionNumbers]}, {labels: [Scope.IntegerNumbers]}], contextLabels: [Scope.SingleFrameOfReference]
        });
        const withDefault = {...base, schema: {kind: [[Scope.IntegerNumbers, Scope.FractionNumbers], defaultResolver] as const}};
        expect(generatorCapabilityInputHash(withDefault)).not.toBe(generatorCapabilityInputHash(base));
        expect(generatorMatchingOntologyLabels(withDefault)).toContain(Scope.SingleFrameOfReference);
        expect(viewMatchingOntologyLabels({...view, compatibility: [{id: 'scope', dependencies: [{scope: 'generator', label: Scope.NumericRange}], predicate: () => true}], spec: undefined})).toContain(Scope.NumericRange);
        expect(generatorMatchingOntologyLabels(generator)).toContain(Scope.FractionNumbers);
    });

    it('does not turn unresolved schema alternatives into invariant support', () => {
        const generator: GeneratorMatchInfo = {generatorId: 'operation', labels: [Area.Addition, Area.Subtraction], problemType: 'ArithmeticPairProblem', schema: {operation: [Area.Addition, Area.Subtraction]}};
        const view: ViewMatchInfo = {viewId: 'task', supportedLabels: [], problemType: 'ArithmeticPairProblem'};
        expect(matchesTarget([Area.Addition, Area.Subtraction], generator, view)).toEqual({matched: false, reason: 'empty-label-domain'});
        const predicateGenerator = {...generator, schema: {addition: [[Area.Addition], hasLabel(Area.Addition)] as const}, labels: [Area.Addition]};
        expect(matchTargets([{id: 'absence', labels: []}], [predicateGenerator], [view]).tuples[0].plan.domains[0].alternatives[0].labels).toEqual([]);
    });
});
