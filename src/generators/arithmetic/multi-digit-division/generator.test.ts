import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    DivisionOperandDecomposition,
    MultiDigitDivisionProblem
} from '../../../types/problems.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';

const legacyProfiles = [1, 2, 3, 4] as const;
const twoDigitDivisorProfiles = [2, 3, 4] as const;

const expectValidDecomposition = (decomposition: DivisionOperandDecomposition): void => {
    expect(decomposition.parts).toHaveLength(String(decomposition.operand).length);
    expect(decomposition.parts.reduce((sum, part) => sum + part.value, 0))
        .toBe(decomposition.operand);
    expect(decomposition.parts.map(part => part.placeValue)).toEqual(Array.from(
        {length: decomposition.parts.length},
        (_, index) => 10 ** (decomposition.parts.length - index - 1)
    ));
    for (const part of decomposition.parts) {
        expect(part.digit).toBeGreaterThanOrEqual(0);
        expect(part.digit).toBeLessThanOrEqual(9);
        expect(part.value).toBe(part.digit * part.placeValue);
    }
};

const expectConsistentProblem = (problem: MultiDigitDivisionProblem): void => {
    expect(problem.task).toBe('multi-digit-division');
    expect(String(problem.dividend)).toHaveLength(problem.dividendDigits);
    expect(String(problem.divisor)).toHaveLength(problem.divisorDigits);
    expect(problem.divisor).toBeGreaterThanOrEqual(problem.divisorDigits === 1 ? 2 : 10);
    expect(problem.divisor).toBeLessThanOrEqual(problem.divisorDigits === 1 ? 9 : 99);
    expect(problem.quotient).toBeGreaterThan(0);
    expect(problem.remainder).toBeGreaterThanOrEqual(0);
    expect(problem.remainder).toBeLessThan(problem.divisor);
    expect(problem.dividend).toBe(problem.divisor * problem.quotient + problem.remainder);
    expectValidDecomposition(problem.dividendDecomposition);
    expectValidDecomposition(problem.divisorDecomposition);
    expect(problem.dividendDecomposition.operand).toBe(problem.dividend);
    expect(problem.divisorDecomposition.operand).toBe(problem.divisor);

    const quotientDigits = String(problem.quotient).split('').map(Number);
    expect(problem.partialQuotients).toHaveLength(quotientDigits.length);
    let remaining = problem.dividend;
    problem.partialQuotients.forEach((step, index) => {
        const placeValue = 10 ** (quotientDigits.length - index - 1);
        expect(step.quotientDigit).toBe(quotientDigits[index]);
        expect(step.placeValue).toBe(placeValue);
        expect(step.partialQuotient).toBe(step.quotientDigit * placeValue);
        expect(step.remainingBefore).toBe(remaining);
        expect(step.partialProduct).toBe(problem.divisor * step.partialQuotient);
        expect(step.remainingAfter).toBe(step.remainingBefore - step.partialProduct);
        expect(step.remainingAfter).toBeGreaterThanOrEqual(problem.remainder);
        remaining = step.remainingAfter;
    });
    expect(remaining).toBe(problem.remainder);
    expect(problem.partialQuotients.reduce((sum, step) => sum + step.partialQuotient, 0))
        .toBe(problem.quotient);

};

describe('MultiDigitDivisionGenerator', () => {
    const generator = new MultiDigitDivisionGenerator();

    it('strictly validates the dividend digit count', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({divisorDigits: 2, dividendDigits: 1} as never))
            .toThrow('A two-digit divisor requires a dividend of at least two digits.');
        expect(() => generator.generate({divisorDigits: 3, dividendDigits: 2} as never))
            .toThrow('Unsupported divisor digit count "3".');
        expect(() => generator.generate({divisorDigits: 1, dividendDigits: 5} as never))
            .toThrow('Unsupported dividend digit count "5".');
    });

    it.each(legacyProfiles)('generates consistent %i-digit dividend evidence', dividendDigits => {
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`${dividendDigits}-${seed}`);
            const problem = generator.generate({divisorDigits: 1, dividendDigits}).data;
            expect(problem.dividendDigits).toBe(dividendDigits);
            expect(problem.divisorDigits).toBe(1);
            expect(problem.remainder).toBeGreaterThan(0);
            expect(String(problem.dividend)).not.toContain('0');
            expect(String(problem.divisor)).not.toContain('0');
            expect(String(problem.quotient)).not.toContain('0');
            expectConsistentProblem(problem);
        }
    });

    it.each(legacyProfiles)('is deterministic for %i-digit dividends', dividendDigits => {
        setSeed(`multi-digit-division-${dividendDigits}`);
        const first = generator.generate({divisorDigits: 1, dividendDigits});
        setSeed(`multi-digit-division-${dividendDigits}`);
        expect(generator.generate({divisorDigits: 1, dividendDigits})).toEqual(first);
    });

    it.each(twoDigitDivisorProfiles)(
        'generates exact and remainder cases with a two-digit divisor and %i-digit dividend',
        dividendDigits => {
            const remainders = new Set<number>();
            for (let seed = 0; seed < 200; seed++) {
                setSeed(`two-digit-${dividendDigits}-${seed}`);
                const problem = generator.generate({divisorDigits: 2, dividendDigits}).data;
                expect(problem.divisorDigits).toBe(2);
                expect(problem.dividendDigits).toBe(dividendDigits);
                expectConsistentProblem(problem);
                remainders.add(problem.remainder === 0 ? 0 : 1);
            }
            expect(remainders).toEqual(new Set([0, 1]));
        }
    );

    it('preserves zero quotient places as explicit zero partial-quotient steps', () => {
        let zeroStepCount = 0;
        for (const dividendDigits of [3, 4] as const) {
            for (let seed = 0; seed < 500; seed++) {
                setSeed(`zero-quotient-${dividendDigits}-${seed}`);
                const problem = generator.generate({divisorDigits: 2, dividendDigits}).data;
                for (const step of problem.partialQuotients) {
                    if (step.quotientDigit !== 0) continue;
                    zeroStepCount++;
                    expect(step.partialQuotient).toBe(0);
                    expect(step.partialProduct).toBe(0);
                    expect(step.remainingAfter).toBe(step.remainingBefore);
                }
            }
        }
        expect(zeroStepCount).toBeGreaterThan(0);
    });

    it.each(twoDigitDivisorProfiles)(
        'replays seeded two-digit-divisor problems with %i-digit dividends', dividendDigits => {
            setSeed(`two-digit-replay-${dividendDigits}`);
            const first = generator.generate({divisorDigits: 2, dividendDigits});
            setSeed(`two-digit-replay-${dividendDigits}`);
            expect(generator.generate({divisorDigits: 2, dividendDigits})).toEqual(first);
        }
    );

    it('never introduces a standalone zero in numeric procedure evidence', () => {
        for (const dividendDigits of legacyProfiles) {
            for (let seed = 0; seed < 500; seed++) {
                setSeed(`nonzero-${dividendDigits}-${seed}`);
                const problem = generator.generate({divisorDigits: 1, dividendDigits}).data;
                const evidence = [
                    problem.dividend,
                    problem.divisor,
                    problem.quotient,
                    problem.remainder,
                    ...problem.dividendDecomposition.parts.flatMap(part => [part.digit, part.value]),
                    ...problem.divisorDecomposition.parts.flatMap(part => [part.digit, part.value]),
                    ...problem.partialQuotients.flatMap(step => [
                        step.quotientDigit,
                        step.partialQuotient,
                        step.remainingBefore,
                        step.partialProduct,
                        step.remainingAfter
                    ])
                ];
                expect(evidence.every(value => value > 0)).toBe(true);
            }
        }
    });
});
