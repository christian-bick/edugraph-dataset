import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {expandedNumbers, expandedQuantities, expandedRangeBounds, sparseExpandedNumbers} from './domain.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('integer expanded-form canonical domains', () => {
    it('partitions every one of the15714 originally authored two/three-term numerals without loss or duplication', () => {
        const seen = new Set<number>();
        let legacy = 0, large = 0, profiles = 0;
        for (const cardinality of [2, 3]) {
            const original = sparseExpandedNumbers(cardinality);
            for (const [upper, lower] of expandedRangeBounds) {
                if (cardinality === 3 && lower >= 10) continue;
                const range = createCanonicalNumericRange(upper, lower), rows = expandedNumbers(range, cardinality);
                expect(rows.length).toBeGreaterThan(0);
                for (const number of rows) {
                    expect(seen.has(number)).toBe(false);
                    seen.add(number);
                    expect(hasCanonicalRangeWitness(expandedQuantities(number), range)).toBe(true);
                    if (number < 1000) legacy++; else large++;
                }
                profiles++;
            }
            expect(original.every(number => seen.has(number))).toBe(true);
        }
        let missed = 0, expected = 0;
        for (let n = 100; n < 1000000; n++) {
            const count = String(n).replaceAll('0', '').length;
            if (count !== 2 && count !== 3) continue;
            expected++;
            if (!seen.has(n)) missed++;
        }
        expect(missed).toBe(0);
        expect(expected).toBe(15714);
        expect(seen.size).toBe(expected);
        expect([legacy, large, profiles]).toEqual([891, 14823, 18]);
    });

    it('selects every finite row through native generation in one uniform draw with the same payload branch', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new PlaceValueExpandedGenerator();
        let native = 0;
        for (const [upper, lower] of expandedRangeBounds) for (const cardinality of [2, 3]) {
            if (cardinality === 3 && lower >= 10) continue;
            const range = createCanonicalNumericRange(upper, lower), rows = expandedNumbers(range, cardinality);
            for (let index = 0; index < rows.length; index++) {
                draw.mockClear().mockReturnValue((index + 0.5) / rows.length);
                const data = generator.generate({range, operandCardinality: cardinality === 2 ? Scope.TwoOperands : Scope.ThreeOperands}).data;
                expect(data.number).toBe(rows[index]);
                expect(data.terms).toHaveLength(cardinality);
                expect(data.terms.reduce((a, b) => a + b, 0)).toBe(data.number);
                if ('task' in data) {
                    expect(data.number).toBeGreaterThan(1000);
                    expect(data.placeValues.some(p => p.digit === 0)).toBe(true);
                } else expect(data.number).toBeLessThan(1000);
                expect(draw).toHaveBeenCalledTimes(1);
                native++;
            }
            for (const edge of [0, (2 ** 32 - 1) / 2 ** 32]) {
                draw.mockReturnValue(edge);
                expect(generator.generate({range, operandCardinality: cardinality === 2 ? Scope.TwoOperands : Scope.ThreeOperands}).data.number)
                    .toBe(edge === 0 ? rows[0] : rows.at(-1));
            }
        }
        expect(native).toBe(15714);
    });

    it('rejects unauthored cardinalities, incomplete bounds and infeasible lower/term combinations before randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const range of [undefined, createCanonicalNumericRange(100), createCanonicalNumericRange(10000, 5),
            {...createCanonicalNumericRange(1000), maximumAbove: 0}, {...createCanonicalNumericRange(1000), minimumBelow: 10}])
            expect(() => expandedNumbers(range as never, 2)).toThrow();
        expect(() => expandedNumbers(createCanonicalNumericRange(120), 1)).toThrow();
        expect(() => expandedNumbers(createCanonicalNumericRange(120, 10), 3)).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
