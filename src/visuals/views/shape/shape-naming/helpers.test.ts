import {describe, expect, it} from 'vitest';
import {deriveShapeNamingAppearances} from './helpers.ts';

describe('shape-naming appearances', () => {
    it('derives deterministic, observably different sizes and rotations from the seed', () => {
        const variation = {varyOrientation: true, varySize: true};
        const first = deriveShapeNamingAppearances(42, false, variation);
        const repeated = deriveShapeNamingAppearances(42, false, variation);

        expect(repeated).toEqual(first);
        expect(Math.abs(first[0].size - first[1].size)).toBeGreaterThanOrEqual(28);
        expect(first[0].rotation).not.toBe(first[1].rotation);
        expect(deriveShapeNamingAppearances(43, false, variation)).not.toEqual(first);
    });

    it('keeps solid-shape rotations bounded while retaining size variation', () => {
        const appearances = deriveShapeNamingAppearances(91, true, {varyOrientation: true, varySize: true});
        expect(appearances.every(({rotation}) => rotation >= -12 && rotation <= 20)).toBe(true);
        expect(appearances[0].size).not.toBe(appearances[1].size);
    });

    it('rejects a non-integral render seed', () => {
        expect(() => deriveShapeNamingAppearances(1.5, false, {varyOrientation: true, varySize: true})).toThrow();
    });

    it('varies only the requested observable dimensions', () => {
        const sizeOnly = deriveShapeNamingAppearances(42, false, {varyOrientation: false, varySize: true});
        expect(sizeOnly[0].size).not.toBe(sizeOnly[1].size);
        expect(sizeOnly.every(({rotation}) => rotation === 0)).toBe(true);

        const orientationOnly = deriveShapeNamingAppearances(42, false, {varyOrientation: true, varySize: false});
        expect(orientationOnly.every(({size}) => size === 104)).toBe(true);
        expect(orientationOnly[0].rotation).not.toBe(orientationOnly[1].rotation);
    });
});
