import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {decimalRoundingRangeBlocks, ROUNDING_PLACES, roundingOffsetAt, roundingOffsetCount, roundingOriginalOffsetSpan} from './domain.ts';
import {DecimalRoundingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const ranges = [...[5, 10, 20, 100, 120, 1000].map(upper => createCanonicalNumericRange(upper)),
    ...[5, 10, 20].map(lower => createCanonicalNumericRange(1000, lower))];

describe('decimal rounding interval/offset domains', () => {
    it('analytically partitions every old interval/offset path and preserves its probability', () => {
        for (const zero of [true, false]) for (const place of ROUNDING_PLACES) for (let scenario = 0; scenario < 4; scenario++) {
            const q = place.quantumInTenThousandths, n = 10000000 / q;
            const carry = scenario === 3;
            const originalIntervals = carry ? zero ? 0 : q >= 100000 ? 1 : q === 10000 ? 9 : 99 : zero ? 1 : n - 1;
            const span = roundingOriginalOffsetSpan(scenario, q);
            const originalOffsets = carry ? 1 : roundingOffsetCount(...span, q > 10000);
            const blocks = ranges.flatMap(range => decimalRoundingRangeBlocks(zero, range)
                .filter(block => block.roundingPlace.name === place.name && block.scenario === scenario).map(block => ({range, block})));
            let totalPaths = 0, totalMass = 0;
            for (const {range, block} of blocks) {
                const lastInterval = block.firstInterval + (block.intervalCount - 1) * block.intervalStep;
                expect(block.firstInterval >= (zero ? 0 : 1) && lastInterval < n).toBe(true);
                if (zero) expect(lastInterval).toBe(0);
                if (!carry) {
                    expect(block.intervalStep).toBe(1);
                    expect(block.firstOffset >= span[0] && block.lastOffset <= span[1]).toBe(true);
                    expect(block.excludeWholeOffsets).toBe(q > 10000);
                } else {
                    const step = q >= 100000 ? 1 : q === 10000 ? 10 : 10000 / q;
                    const first = q >= 100000 ? n - 1 : step - 1;
                    expect(block.intervalStep).toBe(step);
                    expect((block.firstInterval - first) % step).toBe(0);
                    expect(lastInterval).toBeLessThanOrEqual(first + (originalIntervals - 1) * step);
                    const offset = q * 4 / 5 + Number((first * q + q * 4 / 5) % 10000 === 0);
                    expect([block.firstOffset, block.lastOffset]).toEqual([offset, offset]);
                }
                const paths = block.intervalCount * block.offsetCount;
                const pathMass = carry ? 1 / originalIntervals : 1 / (n * originalOffsets);
                expect(block.weight / paths).toBeCloseTo(pathMass, 14);
                totalPaths += paths;
                totalMass += block.weight;
                // Within a block, upper endpoint and nearest distance are
                // monotone at these corners; the full product has these bounds.
                for (const interval of [block.firstInterval, lastInterval]) for (const rank of [0, block.offsetCount - 1]) {
                    const lower = interval * q, offset = roundingOffsetAt(block, rank);
                    expect((lower + offset) % 10000).not.toBe(0);
                    expect(hasCanonicalRangeWitness([lower, lower + q, lower + offset, lower + q / 2, offset, q - offset]
                        .map(value => value / 10000), range)).toBe(true);
                }
            }
            // Each block is a subset of the old domain. Pairwise disjointness
            // plus the exact product cardinality proves exhaustive coverage.
            for (let a = 0; a < blocks.length; a++) for (let b = a + 1; b < blocks.length; b++) {
                const left = blocks[a]!.block, right = blocks[b]!.block;
                const intervalOverlap = Math.max(left.firstInterval, right.firstInterval)
                    <= Math.min(left.firstInterval + (left.intervalCount - 1) * left.intervalStep,
                        right.firstInterval + (right.intervalCount - 1) * right.intervalStep);
                const offsetOverlap = roundingOffsetCount(Math.max(left.firstOffset, right.firstOffset),
                    Math.min(left.lastOffset, right.lastOffset), left.excludeWholeOffsets);
                expect(intervalOverlap && offsetOverlap > 0).toBe(false);
            }
            expect(totalPaths).toBe(originalIntervals * originalOffsets);
            expect(totalMass).toBeCloseTo(carry ? zero ? 0 : 1 : zero ? 1 / n : 1 - 1 / n, 12);
        }
    });

    it('rank-selects every allowed offset exactly once, including skipped integer boundaries', () => {
        const block = {firstOffset: 1, lastOffset: 999999, excludeWholeOffsets: true};
        let previous = 0, errors = 0;
        const count = roundingOffsetCount(block.firstOffset, block.lastOffset, true);
        for (let rank = 0; rank < count; rank++) {
            const offset = roundingOffsetAt(block, rank);
            if (offset <= previous || offset % 10000 === 0 || offset - previous !== (previous % 10000 === 9999 ? 2 : 1)) errors++;
            previous = offset;
        }
        expect(errors).toBe(0);
        expect(previous).toBe(999999);
        expect(count).toBe(999900);
        expect(() => roundingOffsetAt(block, -1)).toThrow();
        expect(() => roundingOffsetAt(block, count)).toThrow();
    });

    it('reaches every block corner through the production sampler', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalRoundingGenerator();
        for (const requireZeroEndpoint of [true, false]) for (const range of ranges) {
            const blocks = decimalRoundingRangeBlocks(requireZeroEndpoint, range);
            const total = blocks.reduce((sum, block) => sum + block.weight, 0);
            let prior = 0;
            for (const block of blocks) {
                for (const end of [0, 1]) {
                    const inputs = [(prior + block.weight / 2) / total, end ? 1 - 1e-12 : 0, end ? 1 - 1e-12 : 0];
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({requireZeroEndpoint, range}).data;
                    expect(data.roundingPlace).toEqual(block.roundingPlace);
                    expect(data.lowerCandidateInTenThousandths).toBe((block.firstInterval + (end ? block.intervalCount - 1 : 0) * block.intervalStep)
                        * block.roundingPlace.quantumInTenThousandths);
                    expect(data.distanceToLowerInTenThousandths).toBe(roundingOffsetAt(block, end ? block.offsetCount - 1 : 0));
                    expect(inputs).toEqual([]);
                }
                prior += block.weight;
            }
        }
    });

    it('rejects malformed and empty profiles before drawing randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalRoundingGenerator();
        for (const range of [undefined, createCanonicalNumericRange(10000), createCanonicalNumericRange(1000, 100),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => generator.generate({requireZeroEndpoint: true, range: range as never})).toThrow();
        expect(() => generator.generate({requireZeroEndpoint: true, range: createCanonicalNumericRange(1000)})).toThrow(/No rounding/);
        expect(() => decimalRoundingRangeBlocks('yes' as never, createCanonicalNumericRange(5))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
