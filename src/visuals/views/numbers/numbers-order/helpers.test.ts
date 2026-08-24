import {describe, expect, it} from 'vitest';
import {presentNumbers, sortNumbers} from './helpers.ts';

describe('numbers-order helpers', () => {
    it('sorts numbers in ascending order', () => {
        expect(sortNumbers([5, 2, 9, 1], false)).toEqual([1, 2, 5, 9]);
    });

    it('sorts numbers in descending order', () => {
        expect(sortNumbers([5, 2, 9, 1], true)).toEqual([9, 5, 2, 1]);
    });

    it('derives deterministic question order from the render seed', () => {
        const numbers = [-4, 0, 2, 6, 9];
        expect(presentNumbers(numbers, 7)).toEqual(presentNumbers(numbers, 7));
        expect(presentNumbers(numbers, 7)).not.toEqual(presentNumbers(numbers, 8));
        expect([...presentNumbers(numbers, 7)].sort((a, b) => a - b)).toEqual(numbers);
        expect(presentNumbers(numbers, -7.9)).toEqual(presentNumbers(numbers, 7));
        expect(presentNumbers(numbers, Number.NaN)).toEqual(presentNumbers(numbers, 0));
    });
});
