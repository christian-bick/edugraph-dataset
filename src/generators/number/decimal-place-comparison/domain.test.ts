import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {decimalComparisonRangeCases, decimalEqualityRangeBlocks} from './domain.ts';

const bounds = [5, 10, 20, 100, 120, 1000];
const ranges = bounds.flatMap((upper, index) => [0, ...bounds.slice(0, index)].map(lower => createCanonicalNumericRange(upper, lower)));
const numeric = (digits: readonly number[]) => digits.reduce((value, digit) => value * 10 + digit, 0) / 1000;

describe('decimal place comparison weighted scalar domains', () => {
    it('partitions every original deciding-place/shortening law with total probability one', () => {
        const masses = new Map<string, number>();
        let zeroGlyph = false, noZeroGlyph = false;
        for (const range of ranges) for (const entry of decimalComparisonRangeCases(range)) {
            const key = `${entry.decidingIndex}:${entry.shorter}`;
            masses.set(key, (masses.get(key) ?? 0) + entry.weight);
            for (const draw of [0, 0.17, 0.53, 0.91, 1 - 1e-12]) {
                const [low, high] = entry.sample(() => draw);
                expect(low.findIndex((digit, index) => digit !== high[index])).toBe(entry.decidingIndex);
                expect(low[entry.decidingIndex]).toBeLessThan(high[entry.decidingIndex]!);
                zeroGlyph ||= [...low, ...high].includes(0);
                noZeroGlyph ||= ![...low, ...high].includes(0);
                expect(numeric(low)).toBeGreaterThan(0);
                expect(numeric(high)).toBeGreaterThan(numeric(low));
                expect(low[5]! > 0 || high[5]! > 0).toBe(true);
                if (entry.shorter) {
                    expect(low[5]).toBe(0);
                    expect(high[5]).toBeGreaterThan(0);
                    if (entry.decidingIndex < 4) expect(low[4]).toBe(0);
                }
                expect(hasCanonicalRangeWitness([numeric(low), numeric(high)], range)).toBe(true);
            }
        }
        expect(zeroGlyph && noZeroGlyph).toBe(true);
        expect(masses.size).toBe(11);
        for (let deciding = 0; deciding < 6; deciding++) for (const shorter of deciding < 5 ? [true, false] : [false])
            expect(masses.get(`${deciding}:${shorter}`)).toBeCloseTo(deciding === 5 ? 0.5 : 0.05, 12);
        expect(ranges.filter(range => decimalComparisonRangeCases(range).length > 0)).toHaveLength(9);
        expect(decimalComparisonRangeCases(ranges[0]!)).toBe(decimalComparisonRangeCases(ranges[0]!));
    });

    it('independently enumerates all4495500 thousandths-deciding paths and their triangular probabilities', () => {
        const expected = new Map<string, number>();
        let paths = 0;
        for (let whole = 1; whole <= 999; whole++) for (let tenths = 0; tenths < 10; tenths++)
            for (let hundredths = 0; hundredths < 10; hundredths++) for (let low = 0; low < 9; low++)
                for (let high = low + 1; high < 10; high++) {
                    const prefix = whole + tenths / 10 + hundredths / 100;
                    const upper = bounds.find(bound => prefix + high / 1000 <= bound)!;
                    const lower = [0, ...bounds].find(bound => prefix + low / 1000 < (bounds[bounds.indexOf(bound) + 1] ?? Infinity))!;
                    const key = `${lower}:${upper}`;
                    expected.set(key, (expected.get(key) ?? 0) + 0.5 / 999 / 100 / 9 / (9 - low));
                    paths++;
                }
        expect(paths).toBe(4495500);
        for (const range of ranges) {
            const actual = decimalComparisonRangeCases(range).find(entry => entry.decidingIndex === 5)?.weight ?? 0;
            expect(actual).toBeCloseTo(expected.get(`${range.min}:${range.max}`) ?? 0, 10);
        }
    });

    it('retains all98901 equality values and their unequal pattern masses across six scalar cells', () => {
        const seen = new Set<number>();
        let mass = 0, errors = 0, cells = 0;
        for (const range of ranges) {
            const blocks = decimalEqualityRangeBlocks(range);
            if (blocks.length) cells++;
            for (const block of blocks) {
                const count = block.wholes.length * block.tenths.length * block.hundredths.length;
                expect(block.weight / count).toBeCloseTo(block.hundredths[0] === 0 ? 0.6 / 999 / 9 : 0.4 / 999 / 90, 14);
                mass += block.weight;
                for (const whole of block.wholes) for (const tenths of block.tenths) for (const hundredths of block.hundredths) {
                    const code = whole * 1000 + tenths * 100 + hundredths * 10;
                    if (seen.has(code) || !hasCanonicalRangeWitness([code / 1000], range)) errors++;
                    seen.add(code);
                }
            }
        }
        for (let whole = 1; whole <= 999; whole++) for (let fraction = 1; fraction <= 99; fraction++)
            if (!seen.delete(whole * 1000 + fraction * 10)) errors++;
        expect(errors).toBe(0);
        expect(cells).toBe(6);
        expect(seen.size).toBe(0);
        expect(mass).toBeCloseTo(1, 12);
    });

    it('rejects malformed ranges and unsupported lower descriptors', () => {
        for (const range of [undefined, createCanonicalNumericRange(10000), {min: 1, max: 1000},
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}]) {
            expect(() => decimalComparisonRangeCases(range as never)).toThrow();
            expect(() => decimalEqualityRangeBlocks(range as never)).toThrow();
        }
    });
});
