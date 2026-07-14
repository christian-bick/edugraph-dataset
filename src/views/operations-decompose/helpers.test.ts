import { describe, it, expect } from 'vitest';
import { getDecomposeLayout } from './helpers.ts';

describe('operations-decompose helpers', () => {
    it('calculates decompose layout start position correctly', () => {
        // total = 6. Spacing 18.
        // startX = 100 - (5 * 18) / 2 = 100 - 45 = 55
        const layout = getDecomposeLayout(2, 4, 18);
        expect(layout.startX).toBe(55);
        expect(layout.spacing).toBe(18);
    });
});
