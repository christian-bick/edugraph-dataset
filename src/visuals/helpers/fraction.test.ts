import {describe, expect, it} from 'vitest';
import {formatFraction, presentFraction} from './fraction.ts';

describe('fraction presentation', () => {
    it('derives notation without changing the canonical terms', () => {
        const value = {numerator: 3, denominator: 8 as const};

        expect(formatFraction(value)).toBe('3/8');
        expect(presentFraction(value)).toEqual({...value, notation: '3/8'});
        expect(value).toEqual({numerator: 3, denominator: 8});
    });
});
