import { describe, it, expect } from 'vitest';
import { generateScatteredPositions } from './helpers.ts';

describe('sorting-classify-count helpers', () => {
    it('generates scattered positions deterministically', () => {
        const pos1 = generateScatteredPositions(5);
        const pos2 = generateScatteredPositions(5);
        expect(pos1.positions.length).toBe(5);
        expect(pos1.positions).toEqual(pos2.positions);
    });
});
