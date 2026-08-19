import {describe, expect, it} from 'vitest';
import {deriveShapeNamingAppearances} from './helpers.ts';

describe('shape-naming appearances', () => {
    it('derives deterministic, observably different sizes and rotations from the seed', () => {
        const first = deriveShapeNamingAppearances(42, false);
        const repeated = deriveShapeNamingAppearances(42, false);

        expect(repeated).toEqual(first);
        expect(Math.abs(first[0].size - first[1].size)).toBeGreaterThanOrEqual(28);
        expect(first[0].rotation).not.toBe(first[1].rotation);
        expect(deriveShapeNamingAppearances(43, false)).not.toEqual(first);
    });

    it('keeps solid-shape rotations bounded while retaining size variation', () => {
        const appearances = deriveShapeNamingAppearances(91, true);
        expect(appearances.every(({rotation}) => rotation >= -12 && rotation <= 20)).toBe(true);
        expect(appearances[0].size).not.toBe(appearances[1].size);
    });

    it('rejects a non-integral render seed', () => {
        expect(() => deriveShapeNamingAppearances(1.5, false)).toThrow();
    });
});
