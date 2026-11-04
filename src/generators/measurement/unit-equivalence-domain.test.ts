import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {measurementConversionPairSeeds} from './helpers.ts';
import {buildSingleUnitEquivalence, selectUnitEquivalenceStart, unitEquivalenceQuantities,
    unitEquivalenceRanges, unitEquivalenceStarts} from './unit-equivalence-domain.ts';

const expected = {
    single: {
        1000: [[0, 10000, [2, 3, 4, 5, 6, 7, 8, 9]]],
        100: [[0, 1000, [2, 3, 4, 5, 6, 7, 8, 9]]],
        60: [[0, 120, [2]], [0, 1000, [3, 4, 5, 6, 7, 8, 9]]],
        16: [[0, 100, [2, 3, 4, 5, 6]], [0, 120, [7]], [0, 1000, [8, 9]]]
    },
    sequence: {
        1000: [[0, 10000, [2, 3, 4]], [5, 10000, [5, 6]], [5, 100000, [7, 8, 9]]],
        100: [[0, 1000, [2, 3, 4]], [5, 1000, [5, 6]], [5, 10000, [7, 8, 9]]],
        60: [[0, 1000, [2, 3, 4]], [5, 1000, [5, 6, 7, 8, 9]]],
        16: [[0, 100, [2]], [0, 120, [3]], [0, 1000, [4]], [5, 1000, [5, 6, 7, 8, 9]]]
    }
} as const;

describe('named-unit equality domains', () => {
    describe.each(['single', 'sequence'] as const)('%s mathematics', contract => {
        it.each(Object.values(measurementConversionPairSeeds))('preserves all eight starts with exact canonical cells for $id', pair => {
            const cells = expected[contract][pair.factor];
            expect(unitEquivalenceRanges(contract, pair.id)).toEqual(cells.map(([lower, upper]) => createCanonicalNumericRange(upper, lower)));
            const all = cells.flatMap(([lower, upper, starts]) => {
                const range = createCanonicalNumericRange(upper, lower), actual = unitEquivalenceStarts(contract, pair.id, range);
                expect(actual).toEqual(starts);
                expect(unitEquivalenceStarts(contract, pair.id, range)).toBe(actual);
                for (const [index, start] of starts.entries()) {
                    const draw = vi.fn(() => (index + 0.5) / starts.length);
                    expect(selectUnitEquivalenceStart(actual, draw)).toBe(start);
                    expect(draw).toHaveBeenCalledTimes(1);
                }
                return [...actual];
            });
            expect(all).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
        });
    });

    it('includes one-unit evidence in singles and all assessed row values in tables', () => {
        const pair = measurementConversionPairSeeds['kilometer-meter'];
        expect(unitEquivalenceQuantities('single', pair, 7)).toEqual([1, 1000, 7, 7000]);
        expect(unitEquivalenceQuantities('sequence', pair, 7)).toEqual([1000, 7, 7000, 8, 8000, 9, 9000, 10, 10000, 11, 11000]);
        expect(buildSingleUnitEquivalence(pair, 7)).toEqual({kind: 'unit-equivalence', pair,
            equivalent: {largerValue: 7, smallerValue: 7000}});
        expect(unitEquivalenceStarts('sequence', pair.id, createCanonicalNumericRange(10000, 5))).toContain(6);
        expect(unitEquivalenceStarts('sequence', pair.id, createCanonicalNumericRange(100000, 5))).toContain(7);
        expect(unitEquivalenceStarts('single', 'hour-minute', createCanonicalNumericRange(120))).toEqual([2]);
        expect(unitEquivalenceStarts('single', 'pound-ounce', createCanonicalNumericRange(120))).toEqual([7]);
    });

    it('rejects unsupported contracts/pairs, missing or weak ranges and invalid draws', () => {
        for (const unitPair of ['yard-foot', 'constructor', 'toString', '__proto__'])
            expect(() => unitEquivalenceRanges('single', unitPair as never)).toThrow();
        expect(() => unitEquivalenceRanges('unknown' as never, 'hour-minute')).toThrow();
        expect(() => unitEquivalenceQuantities('unknown' as never, measurementConversionPairSeeds['hour-minute'], 2)).toThrow();
        for (const range of [undefined, null, createCanonicalNumericRange(5), createCanonicalNumericRange(10000, 5),
            {...createCanonicalNumericRange(10000), maximumAbove: 0}, {...createCanonicalNumericRange(10000), minimumBelow: 10}])
            expect(() => unitEquivalenceStarts('single', 'kilometer-meter', range as never)).toThrow();
        for (const value of [NaN, Infinity, -0.1, 1]) expect(() => selectUnitEquivalenceStart([2, 3], () => value)).toThrow();
        expect(() => selectUnitEquivalenceStart([], () => 0)).toThrow();
    });
});
