import { describe, it, expect } from 'vitest';
import { getIconIndexes, getCorrectChoice } from './helpers.ts';

describe('numbers-compare-groups helpers', () => {
    it('generates two distinct icon indexes deterministically', () => {
        const { iconAIndex, iconBIndex } = getIconIndexes('some-problem-id', 8);
        expect(iconAIndex).not.toBe(iconBIndex);
        expect(iconAIndex).toBeGreaterThanOrEqual(0);
        expect(iconAIndex).toBeLessThan(8);
    });

    it('determines correct choice for more question', () => {
        expect(getCorrectChoice(5, 3, false)).toBe('A');
        expect(getCorrectChoice(2, 4, false)).toBe('B');
        expect(getCorrectChoice(4, 4, false)).toBe('equal');
    });

    it('determines correct choice for fewer question', () => {
        expect(getCorrectChoice(5, 3, true)).toBe('B');
        expect(getCorrectChoice(2, 4, true)).toBe('A');
        expect(getCorrectChoice(4, 4, true)).toBe('equal');
    });
});
