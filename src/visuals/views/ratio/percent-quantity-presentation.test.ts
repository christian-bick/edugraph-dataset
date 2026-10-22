import {describe, expect, it} from 'vitest';
import type {PercentQuantityProblem} from '../../../types/problems.ts';
import {isPercentQuantity, percentFactorText, percentRationalText} from './percent-quantity-presentation.ts';

const valid: PercentQuantityProblem = {
    kind: 'percent-quantity', percent: 25,
    perHundred: {numerator: 25, denominator: 100},
    scaleFactor: {numerator: 1, denominator: 4},
    whole: {numerator: 14, denominator: 3},
    part: {numerator: 7, denominator: 6}
};

describe('percentage quantity witnesses', () => {
    it('accepts exact fractional quantities and uniquely invertible scaling', () => {
        expect(isPercentQuantity(valid)).toBe(true);
        expect(isPercentQuantity({...valid, percent: 100,
            perHundred: {numerator: 100, denominator: 100},
            scaleFactor: {numerator: 1, denominator: 1}, part: valid.whole})).toBe(true);
        expect(isPercentQuantity({...valid, percent: 125,
            perHundred: {numerator: 125, denominator: 100},
            scaleFactor: {numerator: 5, denominator: 4},
            whole: {numerator: 12, denominator: 5}, part: {numerator: 3, denominator: 1}})).toBe(true);
    });

    it('checks products exactly even when their cross-products exceed safe floating-point integers', () => {
        const large = {...valid, whole: {numerator: Number.MAX_SAFE_INTEGER, denominator: 1},
            part: {numerator: Number.MAX_SAFE_INTEGER, denominator: 4}};
        expect(isPercentQuantity(large)).toBe(true);
        expect(isPercentQuantity({...large, part: {...large.part, numerator: Number.MAX_SAFE_INTEGER - 1}})).toBe(false);
    });

    it('rejects missing or malformed data, nonpositive percentages, and inconsistent witnesses', () => {
        for (const malformed of [undefined, null, [], {}, {...valid, kind: 'other'},
            {...valid, percent: 0}, {...valid, percent: -1}, {...valid, percent: 25.5},
            {...valid, percent: NaN}, {...valid, percent: Number.MAX_SAFE_INTEGER + 1},
            {...valid, perHundred: undefined}, {...valid, perHundred: {numerator: 24, denominator: 100}},
            {...valid, perHundred: {numerator: 25, denominator: 10}},
            {...valid, scaleFactor: {numerator: 2, denominator: 8}},
            {...valid, scaleFactor: {numerator: 1, denominator: 5}},
            {...valid, whole: {numerator: 0, denominator: 1}},
            {...valid, whole: {numerator: 1, denominator: 0}},
            {...valid, part: {numerator: 0, denominator: 1}},
            {...valid, part: {numerator: 7, denominator: 5}}
        ]) expect(isPercentQuantity(malformed)).toBe(false);
    });
});

describe('percentage quantity number presentation', () => {
    it('preserves exact rational notation and groups fractional factors in equations', () => {
        expect(percentRationalText({numerator: 7, denominator: 6})).toBe('7/6');
        expect(percentRationalText({numerator: 3, denominator: 1})).toBe('3');
        expect(percentFactorText({numerator: 7, denominator: 6})).toBe('(7/6)');
        expect(percentFactorText({numerator: 3, denominator: 1})).toBe('3');
    });
});
