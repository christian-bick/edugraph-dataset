import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    DivisionOperandDecomposition,
    MultiDigitDivisionProblem
} from '../../../types/problems.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';

const profiles = [1, 2, 3, 4] as const;

const expectValidDecomposition = (decomposition: DivisionOperandDecomposition): void => {
    expect(decomposition.parts).toHaveLength(String(decomposition.operand).length);
    expect(decomposition.parts.reduce((sum, part) => sum + part.value, 0))
        .toBe(decomposition.operand);
    expect(decomposition.parts.map(part => part.placeValue)).toEqual(Array.from(
        {length: decomposition.parts.length},
        (_, index) => 10 ** (decomposition.parts.length - index - 1)
    ));
    for (const part of decomposition.parts) {
        expect(part.digit).toBeGreaterThanOrEqual(1);
        expect(part.digit).toBeLessThanOrEqual(9);
        expect(part.value).toBe(part.digit * part.placeValue);
    }
};

const expectConsistentProblem = (problem: MultiDigitDivisionProblem): void => {
    expect(problem.task).toBe('multi-digit-division');
    expect(String(problem.dividend)).toHaveLength(problem.dividendDigits);
    expect(problem.divisorDigits).toBe(1);
    expect(problem.divisor).toBeGreaterThanOrEqual(2);
    expect(problem.divisor).toBeLessThanOrEqual(9);
    expect(problem.quotient).toBeGreaterThan(0);
    expect(problem.remainder).toBeGreaterThan(0);
    expect(problem.remainder).toBeLessThan(problem.divisor);
    expect(problem.dividend).toBe(problem.divisor * problem.quotient + problem.remainder);
    expect(String(problem.dividend)).not.toContain('0');
    expect(String(problem.divisor)).not.toContain('0');
    expect(String(problem.quotient)).not.toContain('0');
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
        expect(step.remainingAfter).toBeGreaterThan(0);
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
            .toThrow('Unsupported divisor digit count "2".');
        expect(() => generator.generate({divisorDigits: 1, dividendDigits: 5} as never))
            .toThrow('Unsupported dividend digit count "5".');
    });

    it.each(profiles)('generates consistent %i-digit dividend evidence', dividendDigits => {
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`${dividendDigits}-${seed}`);
            const problem = generator.generate({divisorDigits: 1, dividendDigits}).data;
            expect(problem.dividendDigits).toBe(dividendDigits);
            expectConsistentProblem(problem);
        }
    });

    it.each(profiles)('is deterministic for %i-digit dividends', dividendDigits => {
        setSeed(`multi-digit-division-${dividendDigits}`);
        const first = generator.generate({divisorDigits: 1, dividendDigits});
        setSeed(`multi-digit-division-${dividendDigits}`);
        expect(generator.generate({divisorDigits: 1, dividendDigits})).toEqual(first);
    });

    it('never introduces a standalone zero in numeric procedure evidence', () => {
        for (const dividendDigits of profiles) {
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
