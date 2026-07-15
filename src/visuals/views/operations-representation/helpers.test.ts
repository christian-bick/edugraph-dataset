import { describe, it, expect } from 'vitest';
import { getAdditionLayout, getSubtractionLayout } from './helpers.ts';

describe('operations-representation helpers', () => {
    it('calculates addition start position correctly', () => {
        // total = 8. Spacing 45.
        // startX = 225 - (7 * 45) / 2 = 225 - 157.5 = 67.5
        const layout = getAdditionLayout(5, 3, 45);
        expect(layout.startX).toBe(67.5);
        expect(layout.spacing).toBe(45);
    });

    it('calculates subtraction start position correctly', () => {
        // num1 = 5. Spacing 45.
        // startX = 225 - (4 * 45) / 2 = 225 - 90 = 135
        const layout = getSubtractionLayout(5, 45);
        expect(layout.startX).toBe(135);
        expect(layout.spacing).toBe(45);
    });
});
