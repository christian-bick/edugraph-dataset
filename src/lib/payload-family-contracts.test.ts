import {getTargetPolicyLabels} from './compatibility.ts';
import {beforeAll, describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {buildCompatibleModulePairIndex, matchesTarget, matchTargets} from './matching.ts';
import {loadMatchingTargets} from './spec-validator.ts';

// These regressions deliberately load declarations only, never generator implementations.
const families = [
    ['counting-objects-count-out', 'counting-selection', 'counting-basic', 'CountingProblem'],
    ['measure-mass', 'measurement-mass', 'measurement-liquid-volume', 'MassVolumeMeasurementProblem'],
    ['measure-liquid-volume', 'measurement-liquid-volume', 'measurement-mass', 'MassVolumeMeasurementProblem'],
    ['measure-mass-estimate', 'measurement-mass-estimation', 'measurement-liquid-volume-estimation', 'MassVolumeEstimateProblem'],
    ['measure-liquid-volume-estimate', 'measurement-liquid-volume-estimation', 'measurement-mass-estimation', 'MassVolumeEstimateProblem'],
    ['numbers-factors-multiples', 'factor-multiple-relations', 'numbers-prime-classification', 'FactorMultipleRelationsProblem'],
    ['numbers-prime-classification', 'numbers-prime-classification', 'numbers-composite-classification', 'FactorMultipleRelationsProblem'],
    ['numbers-composite-classification', 'numbers-composite-classification', 'numbers-prime-classification', 'FactorMultipleRelationsProblem'],
    ['operations-word-problem-equation-formalization', 'arithmetic-word-problems-letter-equation', 'arithmetic-word-problems-two-step', 'ArithmeticWordProblemMultistep'],
    ['operations-word-problem-reasoning', 'arithmetic-word-problems-rounding', 'arithmetic-word-problems-letter-equation', 'ArithmeticWordProblemMultistep'],
    ['operations-word-problem-remainder-interpretation', 'arithmetic-word-problems-interpreted-remainder', 'arithmetic-word-problems-rounding', 'ArithmeticWordProblemMultistep'],
    ['operations-counting-on-operation-derivation', 'integer-addition-counting-on', 'integer-subtraction-counting-back', 'IntegerAddSubtractStrategyProblem'],
    ['operations-counting-back-operation-derivation', 'integer-subtraction-counting-back', 'integer-addition-counting-on', 'IntegerAddSubtractStrategyProblem'],
    ['counting-ten-more-less', 'counting-ten-offset', 'counting-hundred-offset', 'CountingIncDecProblem'],
    ['counting-hundred-more-less', 'counting-hundred-offset', 'counting-ten-offset', 'CountingIncDecProblem'],
    ['place-value-hundreds-bundles', 'place-value-hundreds-bundles', 'place-value-bundles', 'PlaceValueBundlesProblem'],
    ['place-value-hundreds-bundles-explanation', 'place-value-hundreds-bundles', 'place-value-bundles', 'PlaceValueBundlesProblem']
] as const;

describe('declared producer/view payload families', () => {
    let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
    let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;
    beforeAll(async () => {
        [generators, views] = await Promise.all([loadGeneratorModelCatalog(), loadViewModelCatalog()]);
    }, 30_000);

    it.each(families)('%s selects its complete payload contract before target labels', (viewId, generatorId, otherId, broadType) => {
        const view = views.find(view => view.viewId === viewId)!;
        const generator = generators.find(generator => generator.generatorId === generatorId)!;
        const other = generators.find(generator => generator.generatorId === otherId)!;
        const taskRequirements = viewId === 'operations-word-problem-equation-formalization'
            ? [Ability.Formalization] : [];
        expect(getTargetPolicyLabels(view.spec.compatibility, 'require')).toEqual(taskRequirements);
        const generatorRequirements = ['arithmetic-word-problems-letter-equation', 'arithmetic-word-problems-rounding'].includes(generatorId)
            ? [Area.Addition] : [];
        expect(matchesTarget([...taskRequirements, ...generatorRequirements], generator, view)).toEqual({matched: true});
        expect(matchesTarget([], other, view)).toEqual({matched: false, reason: 'incompatible-type'});
        expect(matchesTarget([], {...generator, problemType: broadType}, view))
            .toEqual({matched: false, reason: 'incompatible-type'});
    });

    it.each([
        ['counting-ten-offset', 'counting-ten-more-less', [Scope.StepsOf10, Scope.StepsOf100]],
        ['measurement-mass', 'measure-mass', [Area.MeasuringWeight, Scope.LiquidVolumes]],
        ['numbers-prime-classification', 'numbers-prime-classification', [Area.PrimeNumbers, Area.CompositeNumbers]],
        ['arithmetic-word-problems-letter-equation', 'operations-word-problem-equation-formalization', [Area.Equation, Area.IntegerRounding, Ability.Formalization]],
        ['integer-addition-counting-on', 'operations-counting-on-operation-derivation', [Area.AdditionCountingOn, Area.SubtractionCountingBack]]
    ])('rejects incompatible label conjunctions for %s', (generatorId, viewId, labels) => {
        const verdict = matchesTarget(labels as string[],
            generators.find(generator => generator.generatorId === generatorId)!,
            views.find(view => view.viewId === viewId)!);
        expect(verdict).toMatchObject({matched: false, reason: 'unsupported-label'});
    });

    it('keeps ordinary word solving separate from specialized equation, rounding and remainder tasks', () => {
        const view = views.find(view => view.viewId === 'operations-word-problem-within-100')!;
        for (const id of ['arithmetic-word-problems-letter-equation', 'arithmetic-word-problems-rounding', 'arithmetic-word-problems-interpreted-remainder']) {
            expect(matchesTarget([], generators.find(generator => generator.generatorId === id)!, view))
                .toEqual({matched: false, reason: 'incompatible-type'});
        }
    });

    it('keeps collection-selection mathematics out of ordinary counting views', () => {
        const generator = generators.find(generator => generator.generatorId === 'counting-selection')!;
        for (const id of ['counting-objects-simple', 'counting-objects-one-to-one',
            'counting-objects-cardinality', 'counting-objects-parity', 'counting-conservation']) {
            expect(matchesTarget([], generator, views.find(view => view.viewId === id)!))
                .toEqual({matched: false, reason: 'incompatible-type'});
        }
    });

    it('requires equation-writing intent independently of the producer payload', () => {
        const generator = generators.find(generator => generator.generatorId === 'arithmetic-word-problems-letter-equation')!;
        const view = views.find(view => view.viewId === 'operations-word-problem-equation-formalization')!;
        expect(matchesTarget([Ability.TextualReception, Area.Equation], generator, view))
            .toEqual({matched: false, reason: 'missing-required-label', label: Ability.Formalization});
        expect(matchesTarget([Ability.TextualReception, Ability.Formalization, Area.Addition], generator, view))
            .toEqual({matched: true});
    });

    it('uses distinct complete-tens and complete-hundreds contracts without a negative selector', () => {
        const view = views.find(view => view.viewId === 'place-value-tens-bundles')!;
        expect(getTargetPolicyLabels(view.spec.compatibility, 'reject')).toEqual([]);
        expect(matchesTarget([], generators.find(generator => generator.generatorId === 'place-value-hundreds-bundles')!, view))
            .toEqual({matched: false, reason: 'incompatible-type'});
    });

    it('requires a complete property witness for both property task identities', () => {
        const property = generators.find(generator => generator.generatorId === 'arithmetic-property-relations')!;
        const ordinary = generators.find(generator => generator.generatorId === 'arithmetic-ops-triples')!;
        for (const viewId of ['operations-properties', 'operations-properties-explanation']) {
            const view = views.find(view => view.viewId === viewId)!;
            expect(matchesTarget([Area.Addition, Area.CommutativeLaw, Scope.NumbersSmaller20], property, view))
                .toEqual({matched: true});
            expect(matchesTarget([Area.Addition, Area.CommutativeLaw, Scope.NumbersSmaller20], ordinary, view))
                .toEqual({matched: false, reason: 'incompatible-type'});
        }
    });

    it('separates completion and explanation throughout the real CCSS property and hundreds routes', async () => {
        const targets = await loadMatchingTargets('ccss');
        const tuples = matchTargets(targets, generators, views).tuples;
        const families = [
            ['1.OA.B.3-properties~', Ability.ProcedureExecution,
                ['operations-properties', 'operations-boxes', 'operations-vertical'], 'operations-properties-explanation'],
            ['3.OA.B.5-distributive-property~', Ability.ProcedureExecution,
                ['operations-properties', 'operations-boxes', 'operations-vertical'], 'operations-properties-explanation'],
            ['2.NBT.A.1a-ten-tens-make-hundred~', Ability.DirectUnderstanding,
                ['place-value-hundreds-bundles'], 'place-value-hundreds-bundles-explanation'],
            ['2.NBT.A.1b-hundreds~', Ability.DirectUnderstanding,
                ['place-value-hundreds-bundles'], 'place-value-hundreds-bundles-explanation']
        ] as const;
        for (const [prefix, completionAbility, completionViews, explanationView] of families) {
            const family = targets.filter(target => target.id.startsWith(prefix));
            expect(family.some(target => target.labels.includes(completionAbility)), prefix).toBe(true);
            expect(family.some(target => target.labels.includes(Ability.ProcedureUnderstanding)), prefix).toBe(true);
            for (const target of family) {
                const explanation = target.labels.includes(Ability.ProcedureUnderstanding);
                expect(target.labels.includes(completionAbility), target.id).toBe(!explanation);
                const routes = tuples.filter(tuple => tuple.target.id === target.id);
                expect(new Set(routes.map(tuple => tuple.viewId)), target.id)
                    .toEqual(new Set(explanation ? [explanationView] : completionViews));
                for (const route of routes.filter(tuple => tuple.viewId.startsWith('operations-properties'))) {
                    expect(route.generatorId).toBe('arithmetic-property-relations');
                }
            }
        }
        const ordinary = targets.find(target => target.id === '2.NBT.B.6-two-three-addends~71b01c5e')!;
        expect(ordinary).toBeDefined();
        expect(tuples.filter(tuple => tuple.target.id === ordinary.id)
            .some(tuple => tuple.viewId.startsWith('operations-properties'))).toBe(false);
    }, 120_000);

    it('does not advertise a ten-step change inside a range smaller than ten', () => {
        const generator = generators.find(generator => generator.generatorId === 'counting-ten-offset')!;
        const view = views.find(view => view.viewId === 'counting-inc-dec')!;
        expect(matchesTarget([Scope.NumbersSmaller10], generator, view))
            .toMatchObject({matched: false, reason: 'unsupported-label'});
        expect(matchesTarget([Scope.NumbersSmaller20], generator, view)).toEqual({matched: true});
    });

    it('agrees between indexed and direct matching for all CCSS targets', async () => {
        const targets = await loadMatchingTargets('ccss');
        const pairs = buildCompatibleModulePairIndex(generators, views).orderedPairs;
        const direct = targets.flatMap(target => pairs
            .filter(pair => matchesTarget(target.labels, pair.generator, pair.view).matched)
            .map(pair => `${target.id}#${pair.generator.generatorId}#${pair.view.viewId}`)).sort();
        const matchedTuples = matchTargets(targets, generators, views).tuples;
        const indexed = matchedTuples
            .map(tuple => `${tuple.target.id}#${tuple.generatorId}#${tuple.viewId}`).sort();
        expect(indexed).toEqual(direct);
        for (const [viewId, generatorId] of families) {
            const tuples = matchedTuples.filter(tuple => tuple.viewId === viewId);
            expect(tuples.length, viewId).toBeGreaterThan(0);
            expect(new Set(tuples.map(tuple => tuple.generatorId)), viewId).toEqual(new Set([generatorId]));
        }
    }, 120_000);
});
