import { describe, it, expect } from 'vitest';
import { generatePositions } from './counting-helpers.ts';

describe('counting-helpers', () => {
    it('returns correct number of positions for line layout', () => {
        const pos = generatePositions(5, 'line', 'test-1');
        expect(pos.length).toBe(5);
        // All y coordinates should be equal for a horizontal line
        const yCoord = pos[0].y;
        pos.forEach(p => expect(p.y).toBe(yCoord));
    });

    it('returns correct number of positions for circle layout', () => {
        const pos = generatePositions(6, 'circle', 'test-2');
        expect(pos.length).toBe(6);
    });

    it('returns correct number of positions for array layout', () => {
        const pos = generatePositions(8, 'array', 'test-3');
        expect(pos.length).toBe(8);
    });

    it('returns correct number of positions for scattered layout', () => {
        const pos = generatePositions(10, 'scattered', 'test-4');
        expect(pos.length).toBe(10);
    });
});
