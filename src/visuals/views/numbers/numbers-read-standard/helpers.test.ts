import {describe, expect, it} from 'vitest';
import {numberToEnglishName} from './helpers.ts';

describe('numbers-read-standard helpers', () => {
    it.each([
        [0, 'zero'],
        [1, 'one'],
        [9, 'nine'],
        [10, 'ten'],
        [11, 'eleven'],
        [19, 'nineteen'],
        [20, 'twenty'],
        [21, 'twenty-one'],
        [40, 'forty'],
        [99, 'ninety-nine'],
        [100, 'one hundred'],
        [101, 'one hundred one'],
        [110, 'one hundred ten'],
        [119, 'one hundred nineteen'],
        [120, 'one hundred twenty']
    ] as const)('converts %i to %s', (number, expected) => {
        expect(numberToEnglishName(number)).toBe(expected);
    });

    it.each([-1, 121, 1.5])('rejects the unsupported value %s', number => {
        expect(() => numberToEnglishName(number)).toThrow(RangeError);
    });
});
