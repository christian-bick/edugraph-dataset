import {describe, expect, it} from 'vitest';
import {decomposeBaseTen} from './helpers.ts';

describe('numbers-write-count helpers', () => {
    it.each([
        [21, {hundreds: 0, tens: 2, ones: 1}],
        [99, {hundreds: 0, tens: 9, ones: 9}],
        [100, {hundreds: 1, tens: 0, ones: 0}],
        [120, {hundreds: 1, tens: 2, ones: 0}]
    ])('decomposes %s into grouped base-ten parts', (number, expected) => {
        expect(decomposeBaseTen(number)).toEqual(expected);
    });
});
