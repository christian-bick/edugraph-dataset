import { describe, it, expect } from 'vitest';
import { generatePositions } from './counting-helpers.ts';

describe('counting-helpers', () => {
    it('returns correct number of positions for line layout', () => {
        const pos = generatePositions(5, 'line', 101);
        expect(pos.length).toBe(5);
        // All y coordinates should be equal for a horizontal line
        const yCoord = pos[0].y;
        pos.forEach(p => expect(p.y).toBe(yCoord));
    });

    it('returns correct number of positions for circle layout', () => {
        const pos = generatePositions(6, 'circle', 102);
        expect(pos.length).toBe(6);
    });

    it('places an array in bounded rows and columns', () => {
        const pos = generatePositions(8, 'array', 103);
        expect(pos.length).toBe(8);
        expect(new Set(pos.map(({ x }) => x)).size).toBe(3);
        expect(new Set(pos.map(({ y }) => y)).size).toBe(3);
        pos.forEach(({ x, y }) => {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x + 40).toBeLessThanOrEqual(450);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y + 40).toBeLessThanOrEqual(300);
        });
    });

    it('returns correct number of positions for scattered layout', () => {
        const pos = generatePositions(10, 'scattered', 104);
        expect(pos.length).toBe(10);
    });
});
