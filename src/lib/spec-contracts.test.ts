import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope, bundledContext} from 'edugraph-ts/generated';
import {createOntologyContext, RELATION_IRIS} from 'edugraph-ts/core';
import {buildCompatibleModulePairIndex, type GeneratorMatchInfo, type ViewMatchInfo} from './matching.ts';
import {createWorkCounters} from './work-counters.ts';
import {
    findAbilityLabels,
    findRejectedLabelContractIssues,
    findRequiredLabelContractIssues,
    inspectApplicability
} from './spec-contracts.ts';

const pairs = (generators: Array<[string, string[]]>, viewLabels: string[] = []) =>
    buildCompatibleModulePairIndex(
        generators.map(([generatorId, labels]) => ({generatorId, labels, problemType: 'CountingProblem'})),
        [{viewId: 'v', supportedLabels: viewLabels, problemType: 'CountingProblem'}]
    ).orderedPairs.map(pair => ({generatorId: pair.generator.generatorId, supportedTargetLabels: pair.supportedTargetLabels}));

describe('findAbilityLabels', () => {
    it('separates Ability entities from Area and Scope labels', () => {
        expect(findAbilityLabels([
            Area.Equation,
            Ability.Formalization,
            Scope.ArabicNumerals
        ])).toEqual([Ability.Formalization]);
    });
});

describe('findRequiredLabelContractIssues', () => {
    it('accepts required labels supplied by every compatible generator', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            rejectedLabels: [],
            compatiblePairs: pairs([
                ['first', [Area.PrimeNumbers]],
                ['second', [Area.PrimeNumbers, Scope.IntegerNumbers]]
            ])
        })).toEqual([]);
    });

    it('reports every compatible pair that cannot establish a requirement', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            rejectedLabels: [],
            compatiblePairs: pairs([
                ['supported', [Area.PrimeNumbers]],
                ['missing', [Area.CompositeNumbers]]
            ])
        })).toContainEqual({
            kind: 'pair-missing-required-label',
            generatorId: 'missing',
            label: Area.PrimeNumbers
        });
    });

    it('accepts a requirement supplied by the view in any label dimension', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Ability.Formalization],
            rejectedLabels: [],
            compatiblePairs: pairs([['writing', [Area.NumerationWithIntegers]]], [Ability.Formalization])
        })).toEqual([]);
    });

    it('rejects contradictory and generator-less requirements', () => {
        expect(findRequiredLabelContractIssues({
            requiredLabels: [Area.PrimeNumbers],
            rejectedLabels: [Area.PrimeNumbers],
            compatiblePairs: []
        })).toEqual([
            {kind: 'required-and-rejected-label', label: Area.PrimeNumbers, rejectedLabel: Area.PrimeNumbers},
            {kind: 'no-compatible-generator'}
        ]);
    });

    it.each([[Area.Square, Area.Rectangle], [Scope.NumbersSmaller10, Scope.NumericRange]])(
        'rejects requiring %s while rejecting its specialization ancestor %s', (label, rejectedLabel) => {
            expect(findRequiredLabelContractIssues({requiredLabels: [label], rejectedLabels: [rejectedLabel],
                compatiblePairs: pairs([['g', [label]]])})).toEqual([
                {kind: 'required-and-rejected-label', label, rejectedLabel}
            ]);
        });

    it.each([[Area.Rectangle, Area.Square], [Scope.LengthMeasurement, Scope.Tapemeter],
        [Scope.Tapemeter, Scope.LengthMeasurement]])(
        'allows a narrower rejection or structural relation: %s / %s', (label, rejectedLabel) => {
            expect(findRequiredLabelContractIssues({requiredLabels: [label], rejectedLabels: [rejectedLabel],
                compatiblePairs: pairs([['g', [label]]])})).toEqual([]);
        });

    it('supports requirements through specialization, excluding reverse and structural inheritance', () => {
        const check = (required: string, supplied: string) => findRequiredLabelContractIssues({
            requiredLabels: [required], rejectedLabels: [], compatiblePairs: pairs([['g', [supplied]]])});
        expect(check(Area.Rectangle, Area.Square)).toEqual([]);
        expect(check(Area.Square, Area.Rectangle)).toContainEqual({
            kind: 'pair-missing-required-label', generatorId: 'g', label: Area.Square});
        expect(check(Scope.LengthMeasurement, Scope.Tapemeter)).toContainEqual({
            kind: 'pair-missing-required-label', generatorId: 'g', label: Scope.LengthMeasurement});
    });

    it('finds transitive and multiple-parent rejection witnesses without conflating siblings', () => {
        const iri = (id: string) => `https://fixture.example/${id}`;
        const context = createOntologyContext([
            ...bundledContext.statements.filter(statement => statement.sourceKind === 'schema'),
            ...[['child', 'a'], ['child', 'b'], ['a', 'root'], ['sibling', 'b']].map(([subject, object]) => ({
                subject: iri(subject), predicate: RELATION_IRIS.specializes, object: iri(object),
                source: 'fixture.ttl', sourceKind: 'descriptors' as const
            }))
        ]);
        const issues = findRequiredLabelContractIssues({requiredLabels: [iri('child')],
            rejectedLabels: [iri('root'), iri('sibling'), iri('b')],
            compatiblePairs: [{generatorId: 'g', supportedTargetLabels: new Set([iri('child')])}],
            ancestorsOf: label => new Set([label, ...context.traverse(label, RELATION_IRIS.specializes)])});
        expect(issues).toEqual(['b', 'root'].map(id => ({kind: 'required-and-rejected-label',
            label: iri('child'), rejectedLabel: iri(id)})));
    });

    it('checks wide unrelated requirement/rejection lists with linear lookup work', () => {
        const run = (size: number) => {
            const requiredLabels = Array.from({length: size}, (_, i) => `https://fixture.example/required/${i}`);
            const rejectedLabels = Array.from({length: size}, (_, i) => `https://fixture.example/rejected/${i}`);
            const counters = createWorkCounters();
            expect(findRequiredLabelContractIssues({requiredLabels, rejectedLabels, counters,
                compatiblePairs: [{generatorId: 'g', supportedTargetLabels: new Set(requiredLabels)}]})).toEqual([]);
            return counters.get('applicability.rejection_lookups') + counters.get('applicability.support_lookups');
        };
        expect(run(80)).toBe(run(40) * 2);
    });

    it('checks a deep transitive rejection with work proportional to its ancestry', () => {
        const iri = (id: number) => `https://fixture.example/deep/${id}`;
        const run = (depth: number) => {
            const context = createOntologyContext([
                ...bundledContext.statements.filter(statement => statement.sourceKind === 'schema'),
                ...Array.from({length: depth}, (_, i) => ({subject: iri(i + 1), predicate: RELATION_IRIS.specializes,
                    object: iri(i), source: 'deep.ttl', sourceKind: 'descriptors' as const}))
            ]);
            const counters = createWorkCounters();
            expect(findRequiredLabelContractIssues({requiredLabels: [iri(depth)], rejectedLabels: [iri(0)], counters,
                compatiblePairs: [{generatorId: 'g', supportedTargetLabels: new Set([iri(depth)])}],
                ancestorsOf: label => new Set([label, ...context.traverse(label, RELATION_IRIS.specializes)])
            })).toEqual([{kind: 'required-and-rejected-label', label: iri(depth), rejectedLabel: iri(0)}]);
            return counters.get('applicability.rejection_lookups');
        };
        expect(run(80) - 1).toBe((run(40) - 1) * 2);
    });
});

describe('shared applicability inspection', () => {
    const inspect = (views: ViewMatchInfo[], generators: GeneratorMatchInfo[] = []) =>
        inspectApplicability({views, pairIndex: buildCompatibleModulePairIndex(generators, views)});

    it('checks unmatched views, retains both IRIs, and reports missing compatible generators', () => {
        const issues = inspect([{viewId: 'v', supportedLabels: [], requiredLabels: [Area.Square],
            rejectedLabels: [Area.Rectangle, Ability.Formalization]}]);
        expect(issues.map(issue => issue.kind)).toEqual([
            'required-and-rejected-label', 'no-compatible-generator', 'ability-rejection'
        ]);
        expect(issues[0]).toMatchObject({label: Area.Square, rejectedLabel: Area.Rectangle,
            viewId: 'v', rule_ids: ['SPEC-V3', 'SPEC-V7']});
        expect(issues[0].message).toContain(`requiredLabels '${Area.Square}'`);
        expect(issues[0].message).toContain(`rejectedLabels '${Area.Rectangle}'`);
        expect(issues[1].rule_ids).toEqual(['SPEC-V7']);
        expect(issues[2].rule_ids).toEqual(['SPEC-V3']);
    });

    it('uses the production pair index and reports precisely the unsupported compatible pair', () => {
        const view = {viewId: 'v', supportedLabels: [], requiredLabels: [Area.Rectangle], problemType: 'ShapePolygonDefinitionProblem'};
        const issues = inspect([view], [
            {generatorId: 'ok', labels: [Area.Square], problemType: 'ShapePolygonDefinitionProblem'},
            {generatorId: 'missing', labels: [], problemType: 'ShapePolygonDefinitionProblem'},
            {generatorId: 'incompatible', labels: [], problemType: 'ArithmeticProblem'}
        ]);
        expect(issues).toHaveLength(1);
        expect(issues[0]).toMatchObject({kind: 'pair-missing-required-label', generatorId: 'missing',
            label: Area.Rectangle, viewId: 'v', rule_ids: ['SPEC-V7']});
        expect(issues[0].message).toContain('missing#v');
    });

    it('keeps diagnostics stable under reordered and repeated requirements and rejections', () => {
        const view = {viewId: 'v', supportedLabels: [], requiredLabels: [Area.Square, Area.Rectangle],
            rejectedLabels: [Area.Rectangle, Area.Square]};
        const generators = [{generatorId: 'g2', labels: []}, {generatorId: 'g1', labels: []}];
        const other = {viewId: 'a', supportedLabels: [], rejectedLabels: [Ability.Formalization]};
        expect(inspect([other, {...view, requiredLabels: [Area.Rectangle, Area.Square, Area.Square],
            rejectedLabels: [Area.Square, Area.Rectangle, Area.Rectangle]}], generators.toReversed()))
            .toEqual(inspect([view, other], generators));
        expect(inspect([{viewId: 'empty', supportedLabels: []}])).toEqual([]);
    });

    it('scales with view declarations and compatible pair edges using existing support closures', () => {
        const run = (size: number) => {
            const views = Array.from({length: size}, (_, i) => ({viewId: `v${i}`, problemType: 'CountingProblem', supportedLabels: [],
                requiredLabels: [Area.Square], rejectedLabels: [Area.Rectangle]}));
            const counters = createWorkCounters();
            const pairIndex = buildCompatibleModulePairIndex([{generatorId: 'g', labels: [Area.Square], problemType: 'CountingProblem'}], views);
            expect(inspectApplicability({views, pairIndex, counters})).toHaveLength(size);
            return counters;
        };
        const small = run(40);
        const large = run(80);
        for (const metric of ['views', 'pair_index_entries', 'requirements', 'rejections', 'support_lookups',
            'rejection_lookups', 'issues']) {
            expect(large.get(`applicability.${metric}`)).toBe(small.get(`applicability.${metric}`) * 2);
        }
    });
});

describe('findRejectedLabelContractIssues', () => {
    it('accepts a physical boundary established by a compatible generator', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Scope.NumbersLarger20]
        })).toEqual([]);
    });

    it('rejects Ability filters while permitting Area and Scope boundaries', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Ability.Formalization, Area.MeasuringObjects]
        })).toEqual([
            {kind: 'ability-rejection', label: Ability.Formalization}
        ]);
    });

    it('accepts forward-compatible and ontology-expanded boundaries', () => {
        expect(findRejectedLabelContractIssues({
            rejectedLabels: [Scope.NumbersLarger20, Scope.NumbersLarger100]
        })).toEqual([]);
    });
});
