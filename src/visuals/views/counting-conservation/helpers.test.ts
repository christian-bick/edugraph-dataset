import { describe, it, expect } from 'vitest';
import { getClosePositions, getFarPositions } from './helpers.ts';

describe('counting-conservation helpers', () => {
    it('calculates close positions correctly', () => {
        const positions = getClosePositions(3, 30);
        // center is 200, length 3 with spacing 30 -> starts at 200 - (2*30)/2 = 170
        // positions should be: 170, 200, 230
        expect(positions).toEqual([170, 200, 230]);
    });

    it('calculates far positions correctly', () => {
        const positions = getFarPositions(3, 50);
        // center is 200, length 3 with spacing 50 -> starts at 200 - (2*50)/2 = 150
        // positions should be: 150, 200, 250
        expect(positions).toEqual([150, 200, 250]);
    });
});
