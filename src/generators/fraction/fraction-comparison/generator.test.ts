import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {
    FractionParts,
    LegacyFractionComparisonProblem,
    UnlikeFractionComparisonProblem
} from '../../../types/problems.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {FractionComparisonGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];
afterEach(() => vi.restoreAllMocks());

const fractionKey = ({numerator, denominator}: {numerator: number; denominator: number}) =>
    `${numerator}/${denominator}`;

const expectCoherentProblem = (problem: LegacyFractionComparisonProblem) => {
    expect(problem.task).toBe('compare-fractions');
    expect(denominators).toContain(problem.first.denominator);
    expect(denominators).toContain(problem.second.denominator);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(fractionKey(problem.first)).not.toBe(fractionKey(problem.second));
    expect(problem.sharedWhole).toBe(1);
    const firstValue = problem.first.numerator / problem.first.denominator;
    const secondValue = problem.second.numerator / problem.second.denominator;
    if (problem.relation === 'greater') expect(firstValue).toBeGreaterThan(secondValue);
    else expect(firstValue).toBeLessThan(secondValue);
};

const config = (
    strategy: Area.FractionCommonDenominatorComparison | Area.FractionCommonNumeratorComparison,
    comparisonFamily: Scope.CommonDenominator | Scope.CommonNumerator,
    relation: Scope.Greater | Scope.Less,
    upper: 5 | 10 = 5
): FractionComparisonGeneratorConfig => ({
    comparisonMode: strategy,
    usesReferenceComparison: false,
    usesCommonDenominator: comparisonFamily === Scope.CommonDenominator,
    usesCommonNumerator: comparisonFamily === Scope.CommonNumerator,
    relation,
    range: createCanonicalNumericRange(upper)
});

const grade4Config = (
    relation: Scope.Greater | Scope.Equal | Scope.Less,
    upper: 5 | 10 = 10
): FractionComparisonGeneratorConfig => ({
    comparisonMode: relation === Scope.Equal ? Area.NumericEquality : Area.NumericInequality,
    usesReferenceComparison: true,
    usesCommonDenominator: false,
    usesCommonNumerator: false,
    relation,
    range: createCanonicalNumericRange(upper)
});

const benchmarkSign = (numerator: number, denominator: number) => {
    const difference = 2 * numerator - denominator;
    return difference > 0 ? 'greater' : difference < 0 ? 'less' : 'equal';
};

const expectCoherentUnlikeProblem = (problem: UnlikeFractionComparisonProblem) => {
    expect(problem.task).toBe('compare-unlike-fractions');
    expect(problem.first.numerator).not.toBe(problem.second.numerator);
    expect(problem.first.denominator).not.toBe(problem.second.denominator);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.strategy).toBe('benchmark-half');
    expect(problem.benchmark).toEqual({
        numerator: 1,
        denominator: 2
    });

    const crossProductDifference = problem.first.numerator * problem.second.denominator
        - problem.second.numerator * problem.first.denominator;
    const expectedRelation = crossProductDifference > 0
        ? 'greater'
        : crossProductDifference < 0
            ? 'less'
            : 'equal';
    expect(problem.relation).toBe(expectedRelation);
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
};

describe('FractionComparisonGenerator', () => {
    const generator = new FractionComparisonGenerator();

    it('strictly validates required and cross-family configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate(config(
            Area.FractionCommonDenominatorComparison,
            Scope.CommonNumerator,
            Scope.Greater
        ))).toThrow('matching fraction comparison strategy');
        expect(() => generator.generate(config(
            Area.FractionCommonNumeratorComparison,
            Scope.CommonDenominator,
            Scope.Greater
        ))).toThrow('matching fraction comparison strategy');
        expect(() => generator.generate({
            ...config(
                Area.FractionCommonDenominatorComparison,
                Scope.CommonDenominator,
                Scope.Greater
            ),
            relation: 'unsupported'
        } as unknown as FractionComparisonGeneratorConfig)).toThrow('Greater, Equal, or Less');
        expect(() => generator.generate({
            ...grade4Config(Scope.Equal),
            comparisonMode: Area.NumericInequality
        })).toThrow('Fraction reference comparison requires');
        expect(() => generator.generate({
            ...grade4Config(Scope.Greater),
            usesCommonDenominator: true
        })).toThrow('without a common-component family');
        expect(() => generator.generate({
            ...config(
                Area.FractionCommonDenominatorComparison,
                Scope.CommonDenominator,
                Scope.Greater
            ),
            comparisonMode: Area.NumericInequality
        })).toThrow('matching fraction comparison strategy');
        expect(() => generator.generate({
            ...config(Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater),
            relation: Scope.Equal
        })).toThrow('Common-component comparison requires');
    });

    it.each([[Scope.Greater, 5], [Scope.Greater, 10], [Scope.Equal, 10], [Scope.Less, 5], [Scope.Less, 10]] as const)(
        'generates coherent Grade 4 benchmark comparisons for %s / upper%s',
        (relation, upper) => {
            const observed = new Set<string>();
            for (let seed = 0; seed < 100; seed++) {
                setSeed(`grade4-${relation}-${seed}`);
                const problem = generator.generate(grade4Config(relation, upper)).data;
                if (problem.task !== 'compare-unlike-fractions') {
                    throw new Error('Expected an unlike-fraction comparison.');
                }
                expectCoherentUnlikeProblem(problem);
                observed.add(`${fractionKey(problem.first)}:${fractionKey(problem.second)}`);
            }
            expect(observed.size).toBeGreaterThan(1);
        }
    );

    it.each([
        [101, Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater, 5, [.25, .75, .5], {
            first: {numerator: 2, denominator: 3},
            second: {numerator: 1, denominator: 3},
            family: 'common-denominator',
            relation: 'greater'
        }],
        [102, Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Less, 10, [.25, .5, .875], {
            first: {numerator: 3, denominator: 6},
            second: {numerator: 5, denominator: 6},
            family: 'common-denominator',
            relation: 'less'
        }],
        [103, Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Greater, 10, [2.5 / 14, .75, .25], {
            first: {numerator: 1, denominator: 3},
            second: {numerator: 1, denominator: 8},
            family: 'common-numerator',
            relation: 'greater'
        }],
        [104, Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less, 10, [6.5 / 14, .875, .7], {
            first: {numerator: 4, denominator: 8},
            second: {numerator: 4, denominator: 6},
            family: 'common-numerator',
            relation: 'less'
        }]
    ] as const)('retains original native fixture %s under its complete part-count profile', (
        _originalSeed,
        strategy,
        family,
        relation,
        upper,
        tape,
        expected
    ) => {
        const draw = vi.spyOn(rng, 'random');
        tape.forEach(value => draw.mockReturnValueOnce(value));
        const problem = generator.generate(config(strategy, family, relation, upper)).data;
        expect(problem).toEqual({
            task: 'compare-fractions',
            ...expected,
            sharedWhole: 1
        });
        expect(draw).toHaveBeenCalledTimes(3);
    });

    it.each([
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater],
        [Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Less],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Greater],
        [Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less]
    ] as const)('generates coherent %s / %s / %s comparisons in both range bands', (
        strategy,
        comparisonFamily,
        relation
    ) => {
        const observed = new Set<string>();
        for (const upper of [5, 10] as const) for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(config(strategy, comparisonFamily, relation, upper)).data;
            if (problem.task !== 'compare-fractions') throw new Error('Expected legacy comparison.');
            expectCoherentProblem(problem);
            observed.add(`${fractionKey(problem.first)}:${fractionKey(problem.second)}`);

            if (comparisonFamily === Scope.CommonDenominator) {
                expect(problem.family).toBe('common-denominator');
                expect(problem.first.denominator).toBe(problem.second.denominator);
            } else {
                expect(problem.family).toBe('common-numerator');
                expect(problem.first.numerator).toBe(problem.second.numerator);
            }
        }
        expect(observed.size).toBeGreaterThan(3);
    });

    it.each([
        ...([Scope.Greater, Scope.Less] as const).flatMap(relation => ([5, 10] as const).flatMap(upper => [
            config(Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, relation, upper),
            config(Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, relation, upper),
            grade4Config(relation, upper)
        ])), grade4Config(Scope.Equal)
    ])('preserves deterministic math and the one/three-draw continuation for %j', generatorConfig => {
        setSeed('fraction-comparison-conditioned');
        const first = generator.generate(generatorConfig);
        const state = rng.getRandomState();
        const continuation = rng.random();
        setSeed('fraction-comparison-conditioned');
        expect(generator.generate(generatorConfig)).toEqual(first);
        expect(rng.getRandomState()).toBe(state);
        expect(rng.random()).toBe(continuation);
        setSeed('fraction-comparison-conditioned');
        for (let i = 0; i < (generatorConfig.usesReferenceComparison ? 1 : 3); i++) rng.random();
        expect(rng.getRandomState()).toBe(state);
        expect(rng.random()).toBe(continuation);
    });

    it('is deterministic for the same repository seed', () => {
        const generatorConfig = config(
            Area.FractionCommonNumeratorComparison,
            Scope.CommonNumerator,
            Scope.Less
        );
        setSeed('fraction-comparison');
        const first = generator.generate(generatorConfig);
        setSeed('fraction-comparison');
        const second = generator.generate(generatorConfig);

        expect(second).toEqual(first);
    });
});
