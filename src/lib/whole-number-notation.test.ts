import {describe, expect, it} from 'vitest';
import {
    createWholeNumberPlaceValues,
    displayWholeNumberPlaceName,
    formatStandardNumeral,
    wholeNumberToEnglishName
} from './whole-number-notation.ts';

describe('whole-number notation helpers', () => {
    it.each([
        [0, 'zero'],
        [19, 'nineteen'],
        [20, 'twenty'],
        [42, 'forty-two'],
        [300, 'three hundred'],
        [508, 'five hundred eight'],
        [12_000, 'twelve thousand'],
        [40_019, 'forty thousand nineteen'],
        [705_284, 'seven hundred five thousand two hundred eighty-four'],
        [1_000_000, 'one million']
    ] as const)('names %i as %s', (number, expected) => {
        expect(wholeNumberToEnglishName(number)).toBe(expected);
    });

    it('formats standard numerals with stable thousands separators', () => {
        expect(formatStandardNumeral(999)).toBe('999');
        expect(formatStandardNumeral(34_005)).toBe('34,005');
        expect(formatStandardNumeral(1_000_000)).toBe('1,000,000');
    });

    it('supplies every place from the leading digit through ones', () => {
        expect(createWholeNumberPlaceValues(405_012)).toEqual([
            {name: 'hundred-thousands', exponent: 5, digit: 4, value: 400_000},
            {name: 'ten-thousands', exponent: 4, digit: 0, value: 0},
            {name: 'thousands', exponent: 3, digit: 5, value: 5_000},
            {name: 'hundreds', exponent: 2, digit: 0, value: 0},
            {name: 'tens', exponent: 1, digit: 1, value: 10},
            {name: 'ones', exponent: 0, digit: 2, value: 2}
        ]);
        expect(createWholeNumberPlaceValues(0)).toEqual([
            {name: 'ones', exponent: 0, digit: 0, value: 0}
        ]);
        expect(displayWholeNumberPlaceName('hundred-thousands')).toBe('hundred thousands');
    });

    it.each([-1, 1.5, 1_000_001, Number.NaN])('rejects unsupported input %s', number => {
        expect(() => wholeNumberToEnglishName(number)).toThrow(RangeError);
        expect(() => formatStandardNumeral(number)).toThrow(RangeError);
        expect(() => createWholeNumberPlaceValues(number)).toThrow(RangeError);
    });
});
