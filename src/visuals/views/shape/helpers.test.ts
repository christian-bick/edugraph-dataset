import {describe, expect, it} from 'vitest';
import {getShapeAppearance} from './helpers.ts';

describe('shape appearance helpers', () => {
    it('is deterministic for a seed and example index', () => {
        expect(getShapeAppearance(42, 1)).toEqual(getShapeAppearance(42, 1));
    });

    it('varies color, orientation, and size independently across examples', () => {
        const appearances = Array.from({length: 8}, (_, index) => getShapeAppearance(42, index));
        expect(new Set(appearances.map(value => value.color)).size).toBeGreaterThan(1);
        expect(new Set(appearances.map(value => value.rotation)).size).toBeGreaterThan(1);
        expect(new Set(appearances.map(value => value.scale)).size).toBeGreaterThan(1);
    });
});
