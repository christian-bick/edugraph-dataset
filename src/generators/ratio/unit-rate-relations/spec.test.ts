import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {UnitRateRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('unit-rate-relations capabilities', () => {
    it.each([
        [Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
            Area.RatioEquivalence, Area.Division, Scope.RationalNumbers, Scope.NumbersWithoutNegatives,
            Ability.Interpretation, Ability.TextualArticulation],
        [Area.Division, Area.ProportionalScaling, Area.RatioEquivalence,
            Scope.RationalNumbers, Scope.NumbersWithoutNegatives,
            Ability.ProcedureExecution, Ability.TextualReception]
    ])('generates a reviewed unit-rate target without a magnitude label', (...labels) => {
        const problem = generateWithLabels(new UnitRateRelationsGenerator(), labels)!;
        expect(problem.data.kind).toBe('unit-rate');
        expect(problem.data.antecedent.value.numerator).toBeLessThan(100);
        expect(problem.data.scaled.antecedent.numerator / problem.data.scaled.antecedent.denominator).toBeLessThan(100);
        expect(problem.labels).toEqual([]);
    });

    it('owns exact ratio normalization and scaled equivalence', () => {
        expect(spec.generalLabels).toEqual([
            Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
            Area.RatioEquivalence, Area.Division, Area.ProportionalScaling,
            Scope.RationalNumbers, Scope.NumbersWithoutNegatives
        ]);
    });

    it.each([Scope.NumbersSmaller20, Scope.NumbersSmaller100])('resolves a real magnitude config for %s', label => {
        const problem = generateWithLabels(new UnitRateRelationsGenerator(), [label])!;
        expect(problem.labels).toContain(label);
        expect(problem.data.kind).toBe('unit-rate');
    });

    it('does not select a different relation for interpretation versus execution', () => {
        setSeed(19);
        const interpreted = generateWithLabels(new UnitRateRelationsGenerator(), [Scope.NumbersSmaller100, Ability.Interpretation]);
        setSeed(19);
        expect(generateWithLabels(new UnitRateRelationsGenerator(), [Scope.NumbersSmaller100, Ability.ProcedureExecution])).toEqual(interpreted);
    });
});
