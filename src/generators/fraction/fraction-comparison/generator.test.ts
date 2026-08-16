import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionComparisonProblem, FractionParts} from '../../../types/problems.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {FractionComparisonGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const expectCoherentProblem = (problem: FractionComparisonProblem) => {
    expect(problem.task).toBe('compare-fractions');
    expect(problem.first.notation).toBe(`${problem.first.numerator}/${problem.first.denominator}`);
    expect(problem.second.notation).toBe(`${problem.second.numerator}/${problem.second.denominator}`);
    expect(denominators).toContain(problem.first.denominator);
    expect(denominators).toContain(problem.second.denominator);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(problem.first.notation).not.toBe(problem.second.notation);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.rationale).toContain('same whole');
    expect(problem.rationale).toContain(problem.first.notation);
    expect(problem.rationale).toContain(problem.second.notation);
    expect(problem.symbol).toBe(problem.relation === 'greater' ? '>' : '<');
    expect(problem.answer).toBe(`${problem.first.notation} ${problem.symbol} ${problem.second.notation}`);
    const firstValue = problem.first.numerator / problem.first.denominator;
    const secondValue = problem.second.numerator / problem.second.denominator;
    if (problem.relation === 'greater') expect(firstValue).toBeGreaterThan(secondValue);
    else expect(firstValue).toBeLessThan(secondValue);
};

const config = (
    comparisonFamily: Scope.CommonDenominator | Scope.CommonNumerator,
    interpretation: Area.FractionNumeratorInterpretation | Area.FractionDenominatorInterpretation,
    relation: Scope.Greater | Scope.Less
): FractionComparisonGeneratorConfig => ({comparisonFamily, interpretation, relation});

describe('FractionComparisonGenerator', () => {
    const generator = new FractionComparisonGenerator();

    it('strictly validates required and cross-family configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate(config(
            Scope.CommonDenominator,
            Area.FractionDenominatorInterpretation,
            Scope.Greater
        ))).toThrow('CommonDenominator requires');
        expect(() => generator.generate(config(
            Scope.CommonNumerator,
            Area.FractionNumeratorInterpretation,
            Scope.Less
        ))).toThrow('CommonDenominator requires');
        expect(() => generator.generate({
            ...config(
                Scope.CommonDenominator,
                Area.FractionNumeratorInterpretation,
                Scope.Greater
            ),
            relation: 'unsupported'
        } as unknown as FractionComparisonGeneratorConfig)).toThrow('Greater or Less');
    });

    it.each([
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Greater],
        [Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Less],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Greater],
        [Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Less]
    ] as const)('generates coherent %s / %s / %s comparisons', (
        comparisonFamily,
        interpretation,
        relation
    ) => {
        const observed = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(config(comparisonFamily, interpretation, relation)).data;
            expectCoherentProblem(problem);
            observed.add(problem.answer);

            if (comparisonFamily === Scope.CommonDenominator) {
                expect(problem.family).toBe('common-denominator');
                expect(problem.first.denominator).toBe(problem.second.denominator);
                expect(problem.sharedComponent).toBe(problem.first.denominator);
            } else {
                expect(problem.family).toBe('common-numerator');
                expect(problem.first.numerator).toBe(problem.second.numerator);
                expect(problem.sharedComponent).toBe(problem.first.numerator);
            }
        }
        expect(observed.size).toBeGreaterThan(3);
    });

    it('is deterministic for the same repository seed', () => {
        const generatorConfig = config(
            Scope.CommonNumerator,
            Area.FractionDenominatorInterpretation,
            Scope.Less
        );
        setSeed('fraction-comparison');
        const first = generator.generate(generatorConfig);
        setSeed('fraction-comparison');
        const second = generator.generate(generatorConfig);

        expect(second).toEqual(first);
    });
});
