import {describe, expect, it} from 'vitest';
import {displayNumeral, formatThousandths, validDecimalPlaceScaling} from './helpers.ts';
import {decimalBoundaryCase, fractionalCase, wholeCase} from './fixtures.ts';

describe('decimal adjacent-place scaling evidence', () => {
    it('accepts exact whole, fractional, and decimal-boundary comparisons', () => {
        expect(validDecimalPlaceScaling(wholeCase)).toBe(true);
        expect(validDecimalPlaceScaling(fractionalCase)).toBe(true);
        expect(validDecimalPlaceScaling(decimalBoundaryCase)).toBe(true);
        expect(displayNumeral(wholeCase)).toBe('55.000');
        expect(displayNumeral(fractionalCase)).toBe('0.055');
        expect(displayNumeral(decimalBoundaryCase)).toBe('5.500');
    });

    it('formats exact digit contributions without float artifacts', () => {
        expect(formatThousandths(50000)).toBe('50');
        expect(formatThousandths(500)).toBe('0.5');
        expect(formatThousandths(50)).toBe('0.05');
        expect(formatThousandths(5)).toBe('0.005');
    });

    it('rejects a mismatched numeral, place, adjacency, or reciprocal', () => {
        expect(validDecimalPlaceScaling({...wholeCase, numberInThousandths: 56000})).toBe(false);
        expect(validDecimalPlaceScaling({...wholeCase, lowerPlace: {...wholeCase.lowerPlace, digitValueInThousandths: 50}})).toBe(false);
        expect(validDecimalPlaceScaling({...wholeCase, lowerPlace: {...wholeCase.lowerPlace, digitIndex: 3}})).toBe(false);
        expect(validDecimalPlaceScaling({...fractionalCase, scale: {...fractionalCase.scale, reciprocalDenominator: 100 as 10}})).toBe(false);
    });
});
