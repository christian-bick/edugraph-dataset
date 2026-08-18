import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionParts,
    LegacyFractionComparisonProblem,
    UnlikeFractionComparisonProblem
} from '../../../types/problems.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {FractionComparisonGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const expectCoherentProblem = (problem: LegacyFractionComparisonProblem) => {
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
): FractionComparisonGeneratorConfig => ({
    comparisonKind: Area.NumericComparison,
    usesProcedureUnderstanding: false,
    usesReferenceComparison: false,
    usesCommonDenominator: comparisonFamily === Scope.CommonDenominator,
    usesCommonNumerator: comparisonFamily === Scope.CommonNumerator,
    usesNumeratorInterpretation: interpretation === Area.FractionNumeratorInterpretation,
    usesDenominatorInterpretation: interpretation === Area.FractionDenominatorInterpretation,
    relation
});

const grade4Config = (
    relation: Scope.Greater | Scope.Equal | Scope.Less
): FractionComparisonGeneratorConfig => ({
    comparisonKind: relation === Scope.Equal ? Area.NumericEquality : Area.NumericInequality,
    usesProcedureUnderstanding: true,
    usesReferenceComparison: true,
    usesCommonDenominator: false,
    usesCommonNumerator: false,
    usesNumeratorInterpretation: false,
    usesDenominatorInterpretation: false,
    relation
});

const benchmarkSign = (numerator: number, denominator: number) => {
    const difference = 2 * numerator - denominator;
    return difference > 0 ? 'greater' : difference < 0 ? 'less' : 'equal';
};

const expectCoherentUnlikeProblem = (problem: UnlikeFractionComparisonProblem) => {
    expect(problem.task).toBe('compare-unlike-fractions');
    expect(problem.first.numerator).not.toBe(problem.second.numerator);
    expect(problem.first.denominator).not.toBe(problem.second.denominator);
    expect(problem.first.notation).toBe(`${problem.first.numerator}/${problem.first.denominator}`);
    expect(problem.second.notation).toBe(`${problem.second.numerator}/${problem.second.denominator}`);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.strategy).toBe('benchmark-half');
    expect(problem.benchmark).toEqual({
        numerator: 1,
        denominator: 2,
        notation: '1/2',
        xPercent: 50
    });

    const expectedSymbol = problem.relation === 'greater' ? '>' : problem.relation === 'less' ? '<' : '=';
    const crossProductDifference = problem.first.numerator * problem.second.denominator
        - problem.second.numerator * problem.first.denominator;
    const expectedRelation = crossProductDifference > 0
        ? 'greater'
        : crossProductDifference < 0
            ? 'less'
            : 'equal';
    expect(problem.symbol).toBe(expectedSymbol);
    expect(problem.relation).toBe(expectedRelation);
    expect(problem.comparisonKind).toBe(problem.relation === 'equal' ? 'equality' : 'inequality');
    expect(problem.firstBenchmarkRelation).toBe(benchmarkSign(
        problem.first.numerator,
        problem.first.denominator
    ));
    expect(problem.secondBenchmarkRelation).toBe(benchmarkSign(
        problem.second.numerator,
        problem.second.denominator
    ));
    if (problem.relation === 'greater') {
        expect(problem.firstBenchmarkRelation).toBe('greater');
        expect(problem.secondBenchmarkRelation).toBe('less');
    } else if (problem.relation === 'less') {
        expect(problem.firstBenchmarkRelation).toBe('less');
        expect(problem.secondBenchmarkRelation).toBe('greater');
    } else {
        expect(problem.firstBenchmarkRelation).toBe('equal');
        expect(problem.secondBenchmarkRelation).toBe('equal');
    }

    for (const [fraction, model] of [
        [problem.first, problem.firstModel],
        [problem.second, problem.secondModel]
    ] as const) {
        expect(model.partCount).toBe(fraction.denominator);
        expect(model.shadedCount).toBe(fraction.numerator);
        expect(model.filledPercent).toBe(100 * fraction.numerator / fraction.denominator);
        expect(model.benchmarkXPercent).toBe(50);
    }

    const firstPhrase = problem.firstBenchmarkRelation === 'greater'
        ? 'greater than'
        : problem.firstBenchmarkRelation === 'less'
            ? 'less than'
            : 'equal to';
    const secondPhrase = problem.secondBenchmarkRelation === 'greater'
        ? 'greater than'
        : problem.secondBenchmarkRelation === 'less'
            ? 'less than'
            : 'equal to';
    const solutionEquation = `${problem.first.notation} ${expectedSymbol} ${problem.second.notation}`;
    expect(problem.firstBenchmarkStatement).toBe(`${problem.first.notation} is ${firstPhrase} 1/2.`);
    expect(problem.secondBenchmarkStatement).toBe(`${problem.second.notation} is ${secondPhrase} 1/2.`);
    expect(problem.prompt).toBe(
        `Compare ${problem.first.notation} and ${problem.second.notation} using 1/2 as a benchmark on the same whole.`
    );
    expect(problem.questionEquation).toBe(`${problem.first.notation} ? ${problem.second.notation}`);
    expect(problem.solutionEquation).toBe(solutionEquation);
    expect(problem.answer).toBe(solutionEquation);
    expect(problem.answerStatement).toBe(`${solutionEquation}.`);
    expect(problem.rationale).toBe(
        `Both fractions refer to the same whole. ${problem.firstBenchmarkStatement} ${problem.secondBenchmarkStatement} Therefore, ${solutionEquation}.`
    );
};

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
        } as unknown as FractionComparisonGeneratorConfig)).toThrow('Greater, Equal, or Less');
        expect(() => generator.generate({
            ...grade4Config(Scope.Equal),
            comparisonKind: Area.NumericInequality
        })).toThrow('Fraction reference comparison requires');
        expect(() => generator.generate({
            ...grade4Config(Scope.Greater),
            usesCommonDenominator: true
        })).toThrow('without a common-component family');
        expect(() => generator.generate({
            ...config(
                Scope.CommonDenominator,
                Area.FractionNumeratorInterpretation,
                Scope.Greater
            ),
            comparisonKind: Area.NumericInequality
        })).toThrow('Legacy common-component comparison requires');
    });

    it.each([Scope.Greater, Scope.Equal, Scope.Less] as const)(
        'generates coherent Grade 4 benchmark comparisons for %s',
        relation => {
            const observed = new Set<string>();
            for (let seed = 0; seed < 100; seed++) {
                setSeed(`grade4-${relation}-${seed}`);
                const problem = generator.generate(grade4Config(relation)).data;
                if (problem.task !== 'compare-unlike-fractions') {
                    throw new Error('Expected an unlike-fraction comparison.');
                }
                expectCoherentUnlikeProblem(problem);
                observed.add(problem.answer);
            }
            expect(observed.size).toBeGreaterThan(1);
        }
    );

    it.each([
        [101, Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Greater, {
            first: {numerator: 2, denominator: 3, notation: '2/3'},
            second: {numerator: 1, denominator: 3, notation: '1/3'},
            family: 'common-denominator',
            sharedComponent: 3,
            relation: 'greater',
            symbol: '>',
            answer: '2/3 > 1/3',
            rationale: 'Both 2/3 and 1/3 refer to the same whole and share denominator 3; comparing numerators 2 and 1 shows 2/3 is greater than 1/3.'
        }],
        [102, Scope.CommonDenominator, Area.FractionNumeratorInterpretation, Scope.Less, {
            first: {numerator: 3, denominator: 6, notation: '3/6'},
            second: {numerator: 5, denominator: 6, notation: '5/6'},
            family: 'common-denominator',
            sharedComponent: 6,
            relation: 'less',
            symbol: '<',
            answer: '3/6 < 5/6',
            rationale: 'Both 3/6 and 5/6 refer to the same whole and share denominator 6; comparing numerators 3 and 5 shows 3/6 is less than 5/6.'
        }],
        [103, Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Greater, {
            first: {numerator: 1, denominator: 3, notation: '1/3'},
            second: {numerator: 1, denominator: 8, notation: '1/8'},
            family: 'common-numerator',
            sharedComponent: 1,
            relation: 'greater',
            symbol: '>',
            answer: '1/3 > 1/8',
            rationale: 'Both 1/3 and 1/8 refer to the same whole and share numerator 1; denominator 3 makes larger parts than denominator 8, so 1/3 is greater than 1/8.'
        }],
        [104, Scope.CommonNumerator, Area.FractionDenominatorInterpretation, Scope.Less, {
            first: {numerator: 4, denominator: 8, notation: '4/8'},
            second: {numerator: 4, denominator: 6, notation: '4/6'},
            family: 'common-numerator',
            sharedComponent: 4,
            relation: 'less',
            symbol: '<',
            answer: '4/8 < 4/6',
            rationale: 'Both 4/8 and 4/6 refer to the same whole and share numerator 4; denominator 8 makes smaller parts than denominator 6, so 4/8 is less than 4/6.'
        }]
    ] as const)('preserves the legacy seed %s payload and random path', (
        seed,
        family,
        interpretation,
        relation,
        expected
    ) => {
        setSeed(seed);
        const problem = generator.generate(config(family, interpretation, relation)).data;
        expect(problem).toEqual({
            task: 'compare-fractions',
            ...expected,
            sharedWhole: 1
        });
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
            if (problem.task !== 'compare-fractions') throw new Error('Expected legacy comparison.');
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
