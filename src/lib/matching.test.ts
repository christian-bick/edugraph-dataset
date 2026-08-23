import {describe, expect, it} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {
    buildCompatibleModulePairIndex,
    buildDependencyMatchingIndex,
    buildTargetCapabilityPostingIndex,
    generatorCapabilityInputHash,
    matchTargets,
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
    problemType: null
}];

const views = (): ViewMatchInfo[] => [
    {
        viewId: 'execution-view',
        supportedLabels: [Ability.ProcedureExecution],
        problemType: null
    },
    {
        viewId: 'formalization-view',
        supportedLabels: [Ability.Formalization],
        problemType: null
    }
];

const tupleIds = (tuples: readonly MatchTuple[]): string[] => tuples.map(tuple =>
    `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`
);

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
