import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {scalingDecimalRangeBlocks} from './domain.ts';
import {DecimalPlaceValueScalingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [10, 20, 100, 120, 1000];
const units = [100000, 10000, 1000, 100, 10, 1];

describe('adjacent-place compact range domains', () => {
    it('preserves all 177309 original charts and their conditional path probabilities', () => {
        const seen = new Set<number>();
        const counts = [0, 0];
        let errors = 0;
        for (const requireZero of [true, false]) {
            let mass = 0;
            for (const upper of bounds) {
                const range = createCanonicalNumericRange(upper);
                for (const block of scalingDecimalRangeBlocks(requireZero, range)) {
                    const count = block.wholes.length * block.fractionalDigits.reduce((n, values) => n * values.length, 1);
                    const originalMass = requireZero ? block.higherIndex < 2 ? 1 / 81 : 1 / (9 * 6561) : 1 / (27 * 4096);
                    expect(block.weight / count).toBeCloseTo(originalMass, 14);
                    mass += block.weight;
                    for (const whole of block.wholes) for (const a of block.fractionalDigits[0])
                        for (const b of block.fractionalDigits[1]) for (const c of block.fractionalDigits[2]) {
                            const digits = [...whole, a, b, c];
                            const number = digits.reduce((sum, digit, index) => sum + digit * units[index]!, 0);
                            const key = block.higherIndex * 10_000_000 + block.repeatedDigit * 1_000_000 + number;
                            const max = Math.max(number / 1000, 10);
                            if (seen.has(key) || digits.includes(0) !== requireZero || max > upper || max <= range.maximumAbove
                                || digits.filter(digit => digit === block.repeatedDigit).length !== 2) errors++;
                            seen.add(key);
                            counts[requireZero ? 0 : 1]++;
                        }
                }
            }
            expect(mass).toBeCloseTo(requireZero ? 2 + 3 * (6561 - 4096) / 6561 : 1, 12);
        }
        // Independent reconstruction of the old two whole-place and three
        // fractional-place cases proves there are no omitted or added charts.
        for (let repeated = 1; repeated <= 9; repeated++) for (let higher = 0; higher < 5; higher++) {
            const alternatives = Array.from({length: 10}, (_, digit) => digit).filter(digit => digit !== repeated);
            const free = Array.from({length: higher < 2 ? 3 : 6}, (_, index) => index).filter(index => index !== higher && index !== higher + 1);
            for (let code = 0; code < 9 ** free.length; code++) {
                const digits = [0, 0, 0, 0, 0, 0];
                digits[higher] = digits[higher + 1] = repeated;
                free.forEach((index, offset) => { digits[index] = alternatives[Math.floor(code / 9 ** offset) % 9]!; });
                const number = digits.reduce((sum, digit, index) => sum + digit * units[index]!, 0);
                if (!seen.delete(higher * 10_000_000 + repeated * 1_000_000 + number)) errors++;
            }
        }
        expect(errors).toBe(0);
        expect(seen.size).toBe(0);
        expect(counts).toEqual([66717, 110592]);
    });

    it('reaches both ends of every block with the production sampler', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceValueScalingGenerator();
        for (const requireZeroCoefficient of [true, false]) for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper);
            const blocks = scalingDecimalRangeBlocks(requireZeroCoefficient, range);
            const total = blocks.reduce((sum, block) => sum + block.weight, 0);
            let prior = 0;
            for (const block of blocks) {
                for (const end of [0, 1]) {
                    const inputs = [(prior + block.weight / 2) / total, end ? 1 - 1e-12 : 0,
                        ...block.fractionalDigits.filter(values => values.length > 1).map(() => end ? 1 - 1e-12 : 0)];
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({requireZeroCoefficient, range}).data;
                    expect(data.digits).toEqual([...block.wholes[end ? block.wholes.length - 1 : 0]!,
                        ...block.fractionalDigits.map(values => values[end ? values.length - 1 : 0])]);
                    expect(data.repeatedDigit).toBe(block.repeatedDigit);
                    expect(data.higherPlace.digitIndex).toBe(block.higherIndex);
                    expect(inputs).toEqual([]);
                }
                prior += block.weight;
            }
        }
    });

    it('rejects malformed and empty domains before any random draw', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceValueScalingGenerator();
        for (const range of [undefined, createCanonicalNumericRange(5), createCanonicalNumericRange(10000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(10), maximumAbove: 0}, {...createCanonicalNumericRange(10), minimumBelow: 10}])
            expect(() => generator.generate({requireZeroCoefficient: true, range: range as never})).toThrow();
        expect(() => generator.generate({requireZeroCoefficient: false, range: createCanonicalNumericRange(20)})).toThrow(/No adjacent/);
        expect(() => scalingDecimalRangeBlocks(1 as never, createCanonicalNumericRange(10))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
