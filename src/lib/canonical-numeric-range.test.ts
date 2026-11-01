import { describe, expect, it } from 'vitest';
import { CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange, hasCanonicalRangeWitness } from './canonical-numeric-range.ts';

describe('canonical numeric ranges', () => {
    it.each([
        [[2, 3, 5], 5, 0], [[6, 7, 13], 20, 5], [[10, 10, 20], 20, 10],
        [[30, 2, 32], 100, 0], [[45, 50, 95], 100, 20], [[11, 11], 20, 10],
        [[350, 350], 1000, 120], [[-30, 2, -28], 100, 0], [[0, 0], 5, 0]
    ] as const)('accepts the tightest bounds of %j', (values, upper, lower) => {
        expect(hasCanonicalRangeWitness(values, createCanonicalNumericRange(upper, lower))).toBe(true);
    });

    it('rejects loose upper and lower claims and a missing positive lower', () => {
        expect(hasCanonicalRangeWitness([3, 1, 4], createCanonicalNumericRange(10))).toBe(false);
        expect(hasCanonicalRangeWitness([45, 50, 95], createCanonicalNumericRange(100, 10))).toBe(false);
        expect(hasCanonicalRangeWitness([6, 7, 13], createCanonicalNumericRange(20))).toBe(false);
    });

    it('enforces inclusive declared bounds, with strict witness boundaries', () => {
        const range = createCanonicalNumericRange(20, 5);
        expect(hasCanonicalRangeWitness([5, 15, 20], range)).toBe(true);
        expect(hasCanonicalRangeWitness([4, 15, 19], range)).toBe(false);
        expect(hasCanonicalRangeWitness([5, 16, 21], range)).toBe(false);
        expect(hasCanonicalRangeWitness([5, 5, 10], range)).toBe(false);
        expect(hasCanonicalRangeWitness([10, 10, 20], range)).toBe(false);
    });

    it('uses the full catalog when a producer omits an intermediate band', () => {
        expect(createCanonicalNumericRange(100).maximumAbove).toBe(20);
        expect(hasCanonicalRangeWitness([3, 12, 15], createCanonicalNumericRange(100))).toBe(false);
    });

    it('excludes every positive threshold singleton, including opposite signs', () => {
        for (const threshold of CANONICAL_RANGE_THRESHOLDS) {
            for (const upper of CANONICAL_RANGE_THRESHOLDS) {
                for (const lower of [0, ...CANONICAL_RANGE_THRESHOLDS.filter(value => value < upper)]) {
                    const range = createCanonicalNumericRange(upper, lower);
                    expect(hasCanonicalRangeWitness([threshold, threshold], range)).toBe(false);
                    expect(hasCanonicalRangeWitness([-threshold, threshold], range)).toBe(false);
                }
            }
        }
    });

    it.each([[10, 10], [10, 20], [15, 0], [100, 30], [Infinity, 0]])('rejects invalid bounds %j', (upper, lower) => {
        expect(() => createCanonicalNumericRange(upper, lower)).toThrow(/Invalid canonical numeric bounds/);
    });

    it.each([[], [NaN], [Infinity], [-Infinity]].map(values => ({values})))('rejects absent or nonfinite quantities $values', ({values}) => {
        expect(hasCanonicalRangeWitness(values, createCanonicalNumericRange(5))).toBe(false);
    });
});
