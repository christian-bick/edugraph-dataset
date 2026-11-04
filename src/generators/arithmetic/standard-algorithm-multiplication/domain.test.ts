import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as randomModule from '../../../lib/random.ts';
import {buildStandardMultiplicationProblem} from './generator.ts';
import {sampleStandardMultiplicationFactors, standardMultiplicationDomain,
    standardMultiplicationMultipliers, standardMultiplicationMultiplierWeight,
    standardMultiplicationPairWeight, type StandardMultiplicationRange} from './domain.ts';

const cells: {name: string; range: StandardMultiplicationRange; count: number; weight: number}[] = [
    {name: 'upper1000', range: createCanonicalNumericRange(1000), count: 369, weight: 3321000},
    {name: 'upper10000', range: createCanonicalNumericRange(10000), count: 17560, weight: 50384000},
    {name: 'upper100000', range: createCanonicalNumericRange(100000), count: 293772, weight: 166527770},
    {name: 'upper1m', range: createCanonicalNumericRange(1000000), count: 2348923, weight: 210830376},
    {name: 'overflow', range: false, count: 6314706, weight: 151928854}
];
afterEach(() => vi.restoreAllMocks());

describe('standard multiplication finite conditional domains', () => {
    it('retains the exact overlapping multiplier scenarios and multiplicand-width weights', () => {
        for (const multiplier of [9, 1000, 12.5, NaN]) expect(standardMultiplicationMultiplierWeight(multiplier)).toBe(0);
        expect(standardMultiplicationMultiplierWeight(25)).toBe(90);
        expect(standardMultiplicationMultiplierWeight(100)).toBe(9);
        expect(standardMultiplicationMultiplierWeight(123)).toBe(9);
        expect(standardMultiplicationMultiplierWeight(109)).toBe(109);
        expect(standardMultiplicationMultiplierWeight(190)).toBe(109);
        expect(Array.from({length: 990}, (_, index) => standardMultiplicationMultiplierWeight(index + 10))
            .reduce((sum, weight) => sum + weight, 0)).toBe(32400);
        expect(standardMultiplicationPairWeight(99, 99)).toBe(9000);
        expect(standardMultiplicationPairWeight(999, 909)).toBe(1090);
        expect(standardMultiplicationPairWeight(9999, 999)).toBe(9);
        for (const [first, second] of [[9, 25], [10000, 25], [12.5, 25], [25, 9], [25, 1000], [25, 12.5], [10, 10], [11, 19], [14, 14]])
            expect(standardMultiplicationPairWeight(first!, second!)).toBe(0);
    });

    it.each(cells)('keeps the exact native support and integer mass in $name', ({range, count, weight}) => {
        const domain = standardMultiplicationDomain(range);
        expect(domain.count).toBe(count);
        expect(domain.weight).toBe(weight);
        expect(standardMultiplicationDomain(range)).toBe(domain);
        expect(domain.rows.reduce((sum, row) => sum + row.count, 0)).toBe(count);
        expect(domain.rows.reduce((sum, row) => sum + row.weight, 0)).toBe(weight);
        expect(domain.rows.at(-1)!.cumulativeWeight).toBe(weight);
        expect(domain.rows.every((row, index) => row.cumulativeWeight
            === (index === 0 ? 0 : domain.rows[index - 1]!.cumulativeWeight) + row.weight)).toBe(true);
    });

    it.each([
        [12, 1000, 20, 180000], [12, 10000, 402, 667100], [12, 100000, 146, 261400],
        [40, 1000, 1, 9000], [40, 10000, 25, 105400], [40, 100000, 164, 237600],
        [987, 100000, 80, 72000], [987, 1000000, 888, 239920],
        [9999, 1000000, 80, 7200], [9999, false, 888, 23992]
    ] as const)('preserves row support and weights for %i in %s', (multiplicand, upper, count, weight) => {
        const range = upper === false ? false : createCanonicalNumericRange(upper);
        const entries = standardMultiplicationMultipliers(multiplicand, range);
        expect(entries).toHaveLength(count);
        expect(entries.reduce((sum, entry) => sum + standardMultiplicationPairWeight(multiplicand, entry.multiplier), 0)).toBe(weight);
        expect(standardMultiplicationDomain(range).rows.find(row => row.multiplicand === multiplicand)?.weight).toBe(weight);
        expect(entries.every((entry, index) => index === 0 || entry.multiplier > entries[index - 1]!.multiplier)).toBe(true);
        for (const entry of entries) {
            const data = buildStandardMultiplicationProblem(multiplicand, entry.multiplier);
            expect(data.partialRows.some(row => row.columns.some(column => column.carryOut > 0))).toBe(true);
            expect(data.sumColumns.some(column => column.carryOut > 0)).toBe(true);
            expect(entry.weight).toBe(standardMultiplicationMultiplierWeight(entry.multiplier));
        }
    });

    it('includes each shared upper endpoint and keeps only the unrepresentable products in overflow', () => {
        for (const [multiplicand, multiplier, upper] of [[40, 25, 1000], [400, 25, 10000],
            [4000, 25, 100000], [4000, 250, 1000000]]) {
            expect(standardMultiplicationMultipliers(multiplicand!, createCanonicalNumericRange(upper!))
                .some(entry => entry.multiplier === multiplier)).toBe(true);
        }
        expect(standardMultiplicationMultipliers(40, createCanonicalNumericRange(1000))).toEqual([{multiplier: 25, weight: 90}]);
        expect(standardMultiplicationMultipliers(4000, false).some(entry => entry.multiplier === 250)).toBe(false);
        expect(standardMultiplicationMultipliers(4001, false).some(entry => entry.multiplier === 250)).toBe(true);
        expect(standardMultiplicationMultipliers(9999, false).at(-1)?.multiplier).toBe(999);
        expect(cells.reduce((sum, cell) => sum + cell.count, 0)).toBe(8975330);
        expect(cells.reduce((sum, cell) => sum + cell.weight, 0)).toBe(582992000);
    });

    it.each(cells)('inverts both exact integer mass intervals in $name with two draws', ({range}) => {
        const domain = standardMultiplicationDomain(range);
        const draw = vi.spyOn(randomModule, 'random');
        for (const rowIndex of [0, Math.floor(domain.rows.length / 2), domain.rows.length - 1]) {
            const row = domain.rows[rowIndex]!;
            const beforeRow = rowIndex === 0 ? 0 : domain.rows[rowIndex - 1]!.cumulativeWeight;
            const entries = standardMultiplicationMultipliers(row.multiplicand, range);
            for (const multiplierIndex of [0, Math.floor(entries.length / 2), entries.length - 1]) {
                const entry = entries[multiplierIndex]!;
                const beforeMultiplier = entries.slice(0, multiplierIndex).reduce((sum, item) => sum + item.weight, 0);
                draw.mockReset().mockReturnValueOnce((beforeRow + row.weight / 2) / domain.weight)
                    .mockReturnValueOnce((beforeMultiplier + entry.weight / 2) / row.multiplierWeight);
                expect(sampleStandardMultiplicationFactors(range)).toEqual([row.multiplicand, entry.multiplier]);
                expect(draw).toHaveBeenCalledTimes(2);
            }
        }
    });

    it('rejects forged profiles and nonnative row requests before entropy is read', () => {
        const draw = vi.spyOn(randomModule, 'random');
        for (const range of [undefined, null, true, {}, createCanonicalNumericRange(120), createCanonicalNumericRange(1000, 5),
            {...createCanonicalNumericRange(1000), maximumAbove: 0}, {...createCanonicalNumericRange(1000), minimumBelow: 10}]) {
            expect(() => standardMultiplicationDomain(range as never)).toThrow();
            expect(() => sampleStandardMultiplicationFactors(range as never)).toThrow();
        }
        for (const multiplicand of [9, 10000, 12.5, NaN])
            expect(() => standardMultiplicationMultipliers(multiplicand, false)).toThrow();
        expect(standardMultiplicationMultipliers(10, createCanonicalNumericRange(1000))).toEqual([]);
        expect(draw).not.toHaveBeenCalled();
    });
});
