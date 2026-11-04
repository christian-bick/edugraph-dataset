import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {expandedDecimalRangeBlocks} from './domain.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [5, 10, 20, 100, 120, 1000];

describe('expanded decimal compact range domains', () => {
    it('retains all original values and the exact uniform-pattern conditional law', () => {
        const seen = new Uint8Array(1_000_000), counts: number[] = [], masses: number[] = [];
        // Native counts for the five original equally likely pattern branches.
        const patternSizes = [99 * 9, 9 * 9, 999 * 9 ** 3, 100 * 9 ** 2, 900 * 9 ** 2];
        let errors = 0, zeroGlyphs = 0;
        for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper);
            let count = 0, mass = 0;
            for (const block of expandedDecimalRangeBlocks(range)) {
                const combinations = block.wholes.length * block.digits.reduce((n, digits) => n * digits.length, 1);
                expect(block.weight / combinations * patternSizes[block.pattern]!).toBe(801098100);
                mass += block.weight;
                for (const whole of block.wholes) for (const a of block.digits[0])
                    for (const b of block.digits[1]) for (const c of block.digits[2]) {
                        const code = 1000 * whole + 100 * a + 10 * b + c;
                        const digits = [Math.floor(whole / 100), Math.floor(whole / 10) % 10, whole % 10, a, b, c];
                        const max = Math.max(code / 1000, ...digits);
                        if (seen[code] || max > upper || max <= range.maximumAbove) errors++;
                        seen[code]++;
                        zeroGlyphs += Number(digits.includes(0));
                        count++;
                    }
            }
            counts.push(count);
            masses.push(mass);
        }
        // Reconstruct source support independently of the compact blocks.
        let originalCount = 0;
        for (let whole = 0; whole < 1000; whole++) for (let fraction = 1; fraction < 1000; fraction++) {
            const a = Math.floor(fraction / 100), b = Math.floor(fraction / 10) % 10, c = fraction % 10;
            const original = c > 0 && (a === 0 ? (b === 0 ? whole >= 1 && whole <= 99 : whole <= 99)
                : b === 0 ? whole === 0 || whole >= 100 : whole >= 1);
            if (seen[1000 * whole + fraction] !== Number(original)) errors++;
            originalCount += Number(original);
        }
        expect(errors).toBe(0);
        expect(originalCount).toBe(810243);
        expect(zeroGlyphs).toBe(278802);
        expect(counts).toEqual([670, 6863, 8190, 65520, 16200, 712800]);
        expect(masses).toEqual([278147125, 683104985, 169047810, 1352382480, 33840180, 1488967920]);
        expect(masses.reduce((a, b) => a + b, 0)).toBe(4005490500);
    });

    it('reaches both ends of every compact block with no rejection or extra draw', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new DecimalPlaceValueExpandedGenerator();
        for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper), blocks = expandedDecimalRangeBlocks(range);
            expect(expandedDecimalRangeBlocks(range)).toBe(blocks);
            const total = blocks.reduce((sum, block) => sum + block.weight, 0);
            let prior = 0;
            for (const block of blocks) {
                for (const end of [0, 1]) {
                    const inputs = [(prior + block.weight / 2) / total, end ? 1 - 1e-12 : 0,
                        ...block.digits.filter(values => values.length > 1).map(() => end ? 1 - 1e-12 : 0)];
                    const expectedDraws = inputs.length;
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({range})!.data;
                    expect(data.wholePart).toBe(block.wholes[end ? block.wholes.length - 1 : 0]);
                    expect(data.fractionalDigits).toEqual(block.digits.map(values => values[end ? values.length - 1 : 0]));
                    expect(inputs).toEqual([]);
                    expect(draw).toHaveBeenCalledTimes(expectedDraws);
                }
                prior += block.weight;
            }
        }
    });

    it('rejects malformed domains before consuming randomness', () => {
        const draw = vi.spyOn(rng, 'random'), generator = new DecimalPlaceValueExpandedGenerator();
        for (const range of [undefined, createCanonicalNumericRange(10000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => generator.generate({range: range as never})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
