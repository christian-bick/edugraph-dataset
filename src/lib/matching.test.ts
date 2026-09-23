import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {
    buildCompatibleModulePairIndex,
    buildDependencyMatchingIndex,
    buildTargetCapabilityPostingIndex,
    generatorCapabilityInputHash,
    matchTargets,
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
            requiredLabels: [Ability.Formalization]
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
            requiredLabels: [Scope.NumericRange]
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
                rejectedLabels: [Scope.NumericRange]
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
            requiredLabels, problemType: 'MultiDigitWritingProblem'};
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
        const originalView = {viewId: 'v', problemType: 'ArithmeticPairProblem', supportedLabels: [Ability.ProcedureExecution], requiredLabels: [Area.Rectangle]};
        const currentView = {...originalView, requiredLabels: [required], rejectedLabels: [rejected]};
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
