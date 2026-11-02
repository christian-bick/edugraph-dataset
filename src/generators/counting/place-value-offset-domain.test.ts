import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {buildCountingOffsetProblem, countingOffsetStarts} from './counting-offset.ts';
import {placeValueOffsetQuantities, placeValueOffsetRangeProfiles, placeValueOffsetStarts} from './place-value-offset-domain.ts';

describe('place-value offset domains', () => {
    it('includes the explicit unit1 and each assessed place count while omitting universal floors', () => {
        expect(placeValueOffsetRangeProfiles(10).map(({range}) => [range.min, range.max])).toEqual([[0, 20], [0, 100], [0, 1000]]);
        expect(placeValueOffsetRangeProfiles(100).map(({range}) => [range.min, range.max])).toEqual([[0, 120], [0, 1000]]);
        for (const step of [10, 100] as const) for (const {range} of placeValueOffsetRangeProfiles(step))
            for (const direction of ['inc', 'dec'] as const) for (const zero of [false, true]) {
                for (const start of placeValueOffsetStarts(step, range, direction, 'unrestricted', zero)) {
                    const data = buildCountingOffsetProblem(start, direction, step, range.max), values = placeValueOffsetQuantities(data);
                    expect(values).toContain(1);
                    expect(values.includes(0)).toBe(zero);
                    expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                    expect(Math.max(...values)).toBe(Math.max(data.numObjects, data.incDecAnswer));
                }
            }
    });
    it('retains every original primary frame exactly once per width profile, with truthful zero declarations', () => {
        for (const step of [10, 100] as const) for (const direction of ['inc', 'dec'] as const)
            for (const profile of step === 10 ? ['unrestricted', 'two-digit', 'three-digit'] as const : ['unrestricted', 'three-digit'] as const) {
                const original = countingOffsetStarts({range: {min: 1, max: 1000}, direction}, step, profile);
                const partition = placeValueOffsetRangeProfiles(step).flatMap(({range}) => [false, true].flatMap(zero =>
                    placeValueOffsetStarts(step, range, direction, profile, zero)));
                expect(partition.length).toBe(new Set(partition).size);
                expect([...partition].sort((a, b) => a - b)).toEqual(original);
            }
    });
    it('retains small-primary zero-involving cases and distinguishes visible unit counts from zero digits', () => {
        expect(placeValueOffsetStarts(10, createCanonicalNumericRange(20), 'inc', 'unrestricted', true)).toContain(1);
        expect(placeValueOffsetStarts(10, createCanonicalNumericRange(20), 'dec', 'two-digit', true)).toContain(11);
        expect(placeValueOffsetStarts(100, createCanonicalNumericRange(120), 'inc', 'unrestricted', true)).toContain(11);
        expect(placeValueOffsetStarts(100, createCanonicalNumericRange(120), 'dec', 'three-digit', true)).toContain(111);
        // The previous zero-digit avoidance never supported90→100; this adoption does not retire it.
        expect(countingOffsetStarts({range: {min: 1, max: 1000}, direction: 'inc'}, 10)).not.toContain(90);
        expect(placeValueOffsetRangeProfiles(10).flatMap(({range}) => [false, true].flatMap(zero =>
            placeValueOffsetStarts(10, range, 'inc', 'unrestricted', zero)))).not.toContain(90);
    });
    it('rejects malformed canonical witnesses and impossible width contexts', () => {
        expect(placeValueOffsetStarts(10, {...createCanonicalNumericRange(100), min: 10}, 'inc', 'two-digit', false)).toEqual([]);
        expect(placeValueOffsetStarts(10, createCanonicalNumericRange(120), 'inc', 'unrestricted', false)).toEqual([]);
        expect(placeValueOffsetStarts(100, createCanonicalNumericRange(1000), 'inc', 'two-digit', false)).toEqual([]);
        expect(placeValueOffsetStarts(10, createCanonicalNumericRange(100), 'inc', 'bad' as never, false)).toEqual([]);
    });
});
