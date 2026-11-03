import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {equivalentPairs, nativeEquivalentPairs} from './domain.ts';

describe('proper-fraction part-count domains', () => {
    it('retains every original ordered pair and partitions the eight equal-weight outcomes', () => {
        expect(nativeEquivalentPairs).toEqual([
            {firstNumerator: 1, firstDenominator: 2, scaleFactor: 2},
            {firstNumerator: 1, firstDenominator: 2, scaleFactor: 3},
            {firstNumerator: 1, firstDenominator: 2, scaleFactor: 4},
            {firstNumerator: 1, firstDenominator: 3, scaleFactor: 2},
            {firstNumerator: 2, firstDenominator: 3, scaleFactor: 2},
            {firstNumerator: 1, firstDenominator: 4, scaleFactor: 2},
            {firstNumerator: 2, firstDenominator: 4, scaleFactor: 2},
            {firstNumerator: 3, firstDenominator: 4, scaleFactor: 2}
        ]);
        const smaller = equivalentPairs(createCanonicalNumericRange(5)), larger = equivalentPairs(createCanonicalNumericRange(10));
        expect(smaller).toEqual([nativeEquivalentPairs[0]]);
        expect(larger).toEqual(nativeEquivalentPairs.slice(1));
        expect([...smaller, ...larger]).toEqual(nativeEquivalentPairs);
        for (const pair of larger) expect(pair.firstDenominator * pair.scaleFactor).toBeGreaterThan(5);
    });

    it('rejects unsupported bounds and weakened canonical witnesses', () => {
        const range = createCanonicalNumericRange(10);
        for (const candidate of [undefined, null, {...range, min: 5}, {...range, max: 20},
            {...range, maximumAbove: 0}, {...range, minimumBelow: 0}]) {
            expect(() => equivalentPairs(candidate as never)).toThrow();
        }
    });
});
