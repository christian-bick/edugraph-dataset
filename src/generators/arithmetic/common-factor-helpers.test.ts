import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {commonPositiveDivisors} from './common-factor-helpers.ts';

const euclideanGcd = (first: number, second: number): number => {
    while (second !== 0) [first, second] = [second, first % second];
    return first;
};

describe('complete finite common positive divisors', () => {
    it.each([
        [36, 8, [1, 2, 4]], [0, 100, [1, 2, 4, 5, 10, 20, 25, 50, 100]],
        [100, 0, [1, 2, 4, 5, 10, 20, 25, 50, 100]], [99, 100, [1]],
        [1, 1, [1]], [12, 12, [1, 2, 3, 4, 6, 12]]
    ] as const)('preserves every divisor of (%i,%i)', (first, second, expected) => {
        expect(commonPositiveDivisors(first, second)).toEqual(expected);
    });

    it('agrees with an independent Euclidean GCD for the entire supported finite domain', () => {
        for (let first = 0; first <= 100; first++) {
            for (let second = 0; second <= 100; second++) {
                if (first === 0 && second === 0) continue;
                const gcd = euclideanGcd(first, second);
                const expected = Array.from({length: gcd}, (_, index) => index + 1).filter(divisor => gcd % divisor === 0);
                expect(commonPositiveDivisors(first, second)).toEqual(expected);
            }
        }
    });

    it('rejects an infinite divisor intersection and every invalid input boundary', () => {
        expect(() => commonPositiveDivisors(0, 0)).toThrow(GeneratorValidationError);
        for (const invalid of [-1, -0, 0.5, 101, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => commonPositiveDivisors(invalid, 12)).toThrow(GeneratorValidationError);
            expect(() => commonPositiveDivisors(12, invalid)).toThrow(GeneratorValidationError);
        }
    });
});
