import {describe, expect, it} from 'vitest';
import {getWeightLayout} from './helpers.ts';

describe('measure-compare helpers', () => {
    it('calculates layout correctly when left is heavier', () => {
        const layout = getWeightLayout(8, 4);
        expect(layout.beamRotate).toBe(15);
        expect(layout.leftPanY).toBe(115);
        expect(layout.rightPanY).toBe(65);
    });

    it('calculates layout correctly when right is heavier', () => {
        const layout = getWeightLayout(3, 7);
        expect(layout.beamRotate).toBe(-15);
        expect(layout.leftPanY).toBe(65);
        expect(layout.rightPanY).toBe(115);
    });
});
