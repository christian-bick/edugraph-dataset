import {describe, expect, it} from 'vitest';
import {getComparisonSymbol} from './helpers.ts';

describe('numbers-compare helpers', () => {
    it('maps A to greater-than symbol', () => {
        expect(getComparisonSymbol('A')).toBe('>');
    });

    it('maps B to less-than symbol', () => {
        expect(getComparisonSymbol('B')).toBe('<');
    });

    it('maps equal to equals symbol', () => {
        expect(getComparisonSymbol('equal')).toBe('=');
    });

    it('returns raw symbol if already mapped', () => {
        expect(getComparisonSymbol('<')).toBe('<');
    });
});
