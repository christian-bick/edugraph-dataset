import {describe, expect, it} from 'vitest';
import {getWeightLayout} from './helpers.ts';

describe('measure-compare helpers', () => {
    it('calculates layout correctly when left is heavier', () => {
        const layout = getWeightLayout(8, 4);
        expect(layout.leftBeamY).toBe(105);
        expect(layout.rightBeamY).toBe(75);
        expect(layout.leftPanY).toBe(135);
        expect(layout.rightPanY).toBe(105);
    });

    it('calculates layout correctly when right is heavier', () => {
        const layout = getWeightLayout(3, 7);
        expect(layout.leftBeamY).toBe(75);
        expect(layout.rightBeamY).toBe(105);
        expect(layout.leftPanY).toBe(105);
        expect(layout.rightPanY).toBe(135);
    });
});
