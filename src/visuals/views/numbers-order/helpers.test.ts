import {describe, expect, it} from 'vitest';
import {sortNumbers} from './helpers.ts';

describe('numbers-order helpers', () => {
    it('sorts numbers in ascending order', () => {
        expect(sortNumbers([5, 2, 9, 1], false)).toEqual([1, 2, 5, 9]);
    });

    it('sorts numbers in descending order', () => {
        expect(sortNumbers([5, 2, 9, 1], true)).toEqual([9, 5, 2, 1]);
    });
});
