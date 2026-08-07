import {describe, expect, it} from 'vitest';
import type {PlaceValueBundlesProblem} from '../../../../types/problems.ts';
import {validateBundleProblem} from './helpers.ts';

describe('place-value-tens-bundles helpers', () => {
    it('accepts the exact-one-ten payload', () => {
        expect(() => validateBundleProblem({tens: 1, ones: 0, target: 10})).not.toThrow();
    });

    it('preserves support for multiple complete tens', () => {
        expect(() => validateBundleProblem({tens: 9, ones: 0, target: 90})).not.toThrow();
    });

    it.each([
        {tens: 0, ones: 0, target: 0},
        {tens: 10, ones: 0, target: 100},
        {tens: 1.5, ones: 0, target: 15},
        {tens: 1, ones: 1, target: 11},
        {tens: 1, ones: 0, target: 20}
    ])('rejects an invalid bundle payload: %o', data => {
        expect(() => validateBundleProblem(data as PlaceValueBundlesProblem)).toThrow(/Expected 1-9 complete tens/);
    });
});
