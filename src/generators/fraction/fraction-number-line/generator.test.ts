import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionNumberLineProblem, FractionParts} from '../../../types/problems.ts';
import {FractionNumberLineGenerator} from './generator.ts';
import {FractionNumberLineGeneratorConfig} from './spec.ts';

const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const expectCoherentProblem = (problem: FractionNumberLineProblem) => {
    expect(problem.task).toBe('locate-fraction');
    expect(denominators).toContain(problem.denominator);
    expect(problem.unitFraction).toBe(`1/${problem.denominator}`);
    expect(problem.targetFraction).toBe(`${problem.numerator}/${problem.denominator}`);
    expect(problem.answer).toBe(problem.targetFraction);
    expect(problem.steps).toHaveLength(problem.numerator);
    expect(problem.steps).toEqual(Array.from({length: problem.numerator}, (_, index) => ({
        fromNumerator: index,
        toNumerator: index + 1
    })));
};

describe('FractionNumberLineGenerator', () => {
    const generator = new FractionNumberLineGenerator();

    it('strictly validates the fraction type configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate(
            {fractionType: 'unsupported'} as unknown as FractionNumberLineGeneratorConfig
        ))
            .toThrow('Unsupported fractionType');
    });

    it('generates unit fractions using every Grade 3 denominator', () => {
        const observed = new Set<number>();

        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({fractionType: Scope.UnitFractions}).data;
            observed.add(problem.denominator);

            expectCoherentProblem(problem);
            expect(problem.numerator).toBe(1);
            expect(problem.wholeCount).toBe(1);
        }

        expect(observed).toEqual(new Set(denominators));
    });

    it('generates proper non-unit fractions', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({fractionType: Scope.NonUnitFractions}).data;

            expectCoherentProblem(problem);
            expect(problem.numerator).toBeGreaterThan(1);
            expect(problem.numerator).toBeLessThan(problem.denominator);
            expect(problem.wholeCount).toBe(1);
        }
    });

    it('generates improper fractions between one and two wholes', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({fractionType: Scope.ImproperFractions}).data;

            expectCoherentProblem(problem);
            expect(problem.numerator).toBeGreaterThan(problem.denominator);
            expect(problem.numerator).toBeLessThan(2 * problem.denominator);
            expect(problem.wholeCount).toBe(2);
        }
    });

    it('is deterministic for the same repository seed', () => {
        setSeed('fraction-number-line');
        const first = generator.generate({fractionType: Scope.ImproperFractions});
        setSeed('fraction-number-line');
        const second = generator.generate({fractionType: Scope.ImproperFractions});

        expect(second).toEqual(first);
    });
});
