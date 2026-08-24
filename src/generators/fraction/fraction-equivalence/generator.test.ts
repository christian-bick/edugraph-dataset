import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionParts,
    ProperFractionEquivalenceProblem,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {FractionEquivalenceGenerator} from './generator.ts';
import {FractionEquivalenceGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const properConfig: FractionEquivalenceGeneratorConfig = {
    usesMultiplication: false,
    usesEqualShares: true,
    usesImproperFractions: false,
    usesIntegerNumbers: false,
    usesTenthFractions: false
};

const wholeConfig: FractionEquivalenceGeneratorConfig = {
    usesMultiplication: false,
    usesEqualShares: false,
    usesImproperFractions: true,
    usesIntegerNumbers: true,
    usesTenthFractions: false
};

const multiplicationConfig: FractionEquivalenceGeneratorConfig = {
    ...properConfig,
    usesMultiplication: true
};

const tenthFractionsConfig: FractionEquivalenceGeneratorConfig = {
    ...multiplicationConfig,
    usesTenthFractions: true
};

const expectCoherentPair = (problem: ProperFractionEquivalenceProblem) => {
    expect(problem.task).toBe('relate-equivalent-fractions');
    expect(denominators).toContain(problem.first.denominator);
    expect(denominators).toContain(problem.second.denominator);
    expect(problem.first.numerator).toBeGreaterThan(0);
    expect(problem.first.numerator).toBeLessThan(problem.first.denominator);
    expect(problem.second.numerator).toBeGreaterThan(0);
    expect(problem.second.numerator).toBeLessThan(problem.second.denominator);
    expect(problem.scaleFactor).toBeGreaterThanOrEqual(2);
    expect(problem.scaleFactor).toBeLessThanOrEqual(4);
    expect(problem.second.numerator).toBe(problem.first.numerator * problem.scaleFactor);
    expect(problem.second.denominator).toBe(problem.first.denominator * problem.scaleFactor);
    expect(problem.second.denominator).toBeLessThanOrEqual(8);
    expect(problem.relation).toBe('equal');
};

const expectTenthsProblem = (problem: TenthsToHundredthsProblem): void => {
    const n = problem.tenths.numerator;
    expect(problem.task).toBe('tenths-to-hundredths');
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(10);
    expect(problem.hundredths.numerator).toBe(n * 10);
    expect(problem.tenths).toEqual({numerator: n, denominator: 10});
    expect(problem.hundredths).toEqual({
        numerator: n * 10,
        denominator: 100
    });
    expect(problem.scaleFactor).toBe(10);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.relation).toBe('equal');
    expect(problem).not.toHaveProperty('models');
};

describe('FractionEquivalenceGenerator', () => {
    const generator = new FractionEquivalenceGenerator();

    it('strictly validates the mathematical mode', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({
            ...properConfig,
            usesEqualShares: false
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesIntegerNumbers: false
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...wholeConfig,
            usesMultiplication: true
        })).toThrow('Select EqualShares');
        expect(() => generator.generate({
            ...properConfig,
            usesTenthFractions: true
        })).toThrow('TenthFractions requires Multiplication');
    });

    it('generates an Ability-neutral proper-fraction equivalence relation', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig).data;
            if (problem.task !== 'relate-equivalent-fractions') {
                throw new Error('Expected proper-fraction equivalence.');
            }
            expectCoherentPair(problem);
        }
    });

    it('expresses whole numbers as coherent improper fractions', () => {
        const wholeNumbers = new Set<number>();
        const denominatorsSeen = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(wholeConfig).data;

            if (problem.task !== 'represent-whole-as-fraction') {
                throw new Error('Expected whole-number mode.');
            }
            expect([1, 2, 3]).toContain(problem.wholeNumber);
            expect(denominators).toContain(problem.fraction.denominator);
            expect(problem.fraction.numerator).toBe(
                problem.wholeNumber * problem.fraction.denominator
            );
            expect(problem.relation).toBe('equal');
            wholeNumbers.add(problem.wholeNumber);
            denominatorsSeen.add(problem.fraction.denominator);
        }

        expect(wholeNumbers).toEqual(new Set([1, 2, 3]));
        expect(denominatorsSeen).toEqual(new Set(denominators));
    });

    it('keeps generic multiplication on the generic proper-fraction relation', () => {
        const scaleFactors = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`multiplication-${seed}`);
            const problem = generator.generate(multiplicationConfig).data;
            if (problem.task !== 'relate-equivalent-fractions') {
                throw new Error('Expected a generic proper-fraction scaling relation.');
            }
            expectCoherentPair(problem);
            scaleFactors.add(problem.scaleFactor);
        }
        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
    });

    it('uses TenthFractions to select the exact 10-to-100 denominator relation', () => {
        const tenthsNumerators = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`tenths-${seed}`);
            const problem = generator.generate(tenthFractionsConfig).data;
            if (problem.task !== 'tenths-to-hundredths') {
                throw new Error('Expected a tenths-to-hundredths relation.');
            }
            expectTenthsProblem(problem);
            tenthsNumerators.add(problem.tenths.numerator);
        }
        expect(tenthsNumerators).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    });

    it('preserves deterministic mathematical draws for fixed seeds', () => {
        setSeed('legacy-0');
        expect(generator.generate(properConfig)).toEqual({
            data: {
                task: 'relate-equivalent-fractions',
                first: {numerator: 1, denominator: 4},
                second: {numerator: 2, denominator: 8},
                scaleFactor: 2,
                relation: 'equal'
            }
        });

        setSeed('legacy-2');
        expect(generator.generate(wholeConfig)).toEqual({
            data: {
                task: 'represent-whole-as-fraction',
                wholeNumber: 3,
                fraction: {numerator: 12, denominator: 4},
                relation: 'equal'
            }
        });
    });

    it('covers every proper-fraction scale factor and varies the fraction pair', () => {
        const scaleFactors = new Set<number>();
        const pairs = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const problem = generator.generate(properConfig).data;
            if (problem.task !== 'relate-equivalent-fractions') {
                throw new Error('Expected proper-fraction mode.');
            }
            scaleFactors.add(problem.scaleFactor);
            pairs.add([
                problem.first.numerator,
                problem.first.denominator,
                problem.second.numerator,
                problem.second.denominator
            ].join(':'));
        }

        expect(scaleFactors).toEqual(new Set([2, 3, 4]));
        expect(pairs.size).toBeGreaterThan(3);
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('fraction-equivalence');
        const first = generator.generate(multiplicationConfig);
        setSeed('fraction-equivalence');
        const second = generator.generate(multiplicationConfig);

        expect(second).toEqual(first);
    });
});
