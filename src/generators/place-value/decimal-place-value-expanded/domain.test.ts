import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {expandedDecimalRangeBlocks} from './domain.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [5, 10, 20, 100, 120, 1000];

describe('expanded decimal compact range domains', () => {
    it('partitions every original value exactly once and retains its conditional probability mass', () => {
        const seen = new Uint8Array(1_000_000);
        const counts: number[][] = [];
        let errors = 0;
        for (const requireZero of [true, false]) {
            const profileCounts: number[] = [];
            let mass = 0;
            for (const upper of bounds) {
                const range = createCanonicalNumericRange(upper);
                let count = 0;
                for (const block of expandedDecimalRangeBlocks(requireZero, range)) {
                    const combinations = block.wholes.length * block.digits.reduce((n, digits) => n * digits.length, 1);
                    const originalMass = requireZero ? [1 / 891, 1 / 81, 1 / (999 * 729), 1 / 8100, 1 / 72900][block.pattern]!
                        : 1 / (729 * 729);
                    expect(block.weight / combinations).toBeCloseTo(originalMass, 14);
                    mass += block.weight;
                    for (const whole of block.wholes) for (const a of block.digits[0]) for (const b of block.digits[1]) for (const c of block.digits[2]) {
                        const code = 1000 * whole + 100 * a + 10 * b + c;
                        const digits = [Math.floor(whole / 100), Math.floor(whole / 10) % 10, whole % 10, a, b, c];
                        const max = Math.max(code / 1000, ...digits);
                        if (seen[code] || digits.includes(0) !== requireZero || max > upper || max <= range.maximumAbove) errors++;
                        seen[code]++;
                        count++;
                    }
                }
                profileCounts.push(count);
            }
            expect(mass).toBeCloseTo(requireZero ? 4 + 270 / 999 : 1, 12);
            counts.push(profileCounts);
        }
        // Independently reconstruct the five original patterns, rather than
        // inferring support merely from the new block implementation.
        let originalCount = 0;
        for (let whole = 0; whole < 1000; whole++) for (let fraction = 1; fraction < 1000; fraction++) {
            const a = Math.floor(fraction / 100), b = Math.floor(fraction / 10) % 10, c = fraction % 10;
            const original = c > 0 && (a === 0 ? (b === 0 ? whole >= 1 && whole <= 99 : whole <= 99)
                : b === 0 ? whole === 0 || whole >= 100 : whole >= 1);
            if (seen[1000 * whole + fraction] !== Number(original)) errors++;
            if (original) originalCount++;
        }
        expect(errors).toBe(0);
        expect(originalCount).toBe(810243);
        expect(counts).toEqual([[670, 6863, 8190, 65520, 9639, 187920], [0, 0, 0, 0, 6561, 524880]]);
    });

    it('reaches both ends of every compact block through the production sampler', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceValueExpandedGenerator();
        for (const requireZeroCoefficient of [true, false]) for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper);
            const blocks = expandedDecimalRangeBlocks(requireZeroCoefficient, range);
            const total = blocks.reduce((sum, block) => sum + block.weight, 0);
            let prior = 0;
            for (const block of blocks) {
                for (const end of [0, 1]) {
                    const inputs = [(prior + block.weight / 2) / total, end ? 1 - 1e-12 : 0,
                        ...block.digits.filter(values => values.length > 1).map(() => end ? 1 - 1e-12 : 0)];
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({requireZeroCoefficient, range})!.data;
                    expect(data.wholePart).toBe(block.wholes[end ? block.wholes.length - 1 : 0]);
                    expect(data.fractionalDigits).toEqual(block.digits.map(values => values[end ? values.length - 1 : 0]));
                    expect(inputs).toEqual([]);
                }
                prior += block.weight;
            }
        }
    });

    it('rejects malformed and empty domains before consuming randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceValueExpandedGenerator();
        for (const range of [undefined, createCanonicalNumericRange(10000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => generator.generate({requireZeroCoefficient: true, range: range as never})).toThrow();
        expect(() => generator.generate({requireZeroCoefficient: false, range: createCanonicalNumericRange(5)})).toThrow(/No expanded/);
        expect(() => expandedDecimalRangeBlocks('yes' as never, createCanonicalNumericRange(5))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
