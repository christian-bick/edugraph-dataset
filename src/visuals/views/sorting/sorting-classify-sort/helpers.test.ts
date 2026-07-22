import { describe, it, expect } from 'vitest';
import { generateScatteredPositions, getRelationAnswer } from './helpers.ts';

describe('sorting-classify-sort helpers', () => {
    it('generates scattered positions deterministically', () => {
        const pos1 = generateScatteredPositions(5);
        const pos2 = generateScatteredPositions(5);
        expect(pos1.positions.length).toBe(5);
        expect(pos1.positions).toEqual(pos2.positions);
    });

    it('calculates relation answers correctly', () => {
        const categories = { red: 5, blue: 2, green: 7 };
        const possible = ['red', 'blue', 'green'];
        expect(getRelationAnswer(categories, 'most', possible)).toBe('green');
        expect(getRelationAnswer(categories, 'least', possible)).toBe('blue');
    });
});
