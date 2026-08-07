import {describe, expect, it} from 'vitest';
import {getDecomposeLayout} from './helpers.ts';

describe('operations-decompose helpers', () => {
    it('centers small decompositions in one row', () => {
        const layout = getDecomposeLayout(2, 4);

        expect(layout.height).toBe(50);
        expect(layout.iconSize).toBe(15);
        expect(layout.positions).toHaveLength(6);
        expect(layout.positions[0]).toEqual({left: 47.5, top: 17.5});
        expect(layout.positions[5]).toEqual({left: 137.5, top: 17.5});
    });

    it('wraps large decompositions into centered rows within the card', () => {
        const layout = getDecomposeLayout(40, 59);

        expect(layout.height).toBe(87);
        expect(layout.iconSize).toBe(10);
        expect(layout.positions).toHaveLength(99);
        expect(layout.positions[0]).toEqual({left: 1.5, top: 6});
        expect(layout.positions[17]).toEqual({left: 188.5, top: 6});
        expect(layout.positions[18]).toEqual({left: 1.5, top: 19});
        expect(layout.positions[98]).toEqual({left: 139, top: 71});
    });
});
