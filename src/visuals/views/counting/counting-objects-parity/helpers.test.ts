import {describe, expect, it} from 'vitest';
import {formatParityGrouping} from './helpers.ts';

describe('formatParityGrouping', () => {
    it('describes an empty remainder with the word none', () => {
        expect(formatParityGrouping(4, 0)).toBe('2 groups of 4, none left over');
        expect(formatParityGrouping(4, 0)).not.toContain('0');
    });

    it('describes the single remainder of an odd grouping', () => {
        expect(formatParityGrouping(4, 1)).toBe('2 groups of 4, 1 left over');
    });

    it('describes zero-sized groups when the collection has one object', () => {
        expect(formatParityGrouping(0, 1)).toBe('2 groups of 0, 1 left over');
    });
});
