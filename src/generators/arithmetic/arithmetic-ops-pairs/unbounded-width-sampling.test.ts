import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {sampleUnboundedOperandWidthPair, unboundedSingleDigitRows} from './unbounded-width-sampling.ts';

afterEach(() => vi.restoreAllMocks());
const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
const operands = (operation: typeof operations[number], first: number, second: number) =>
    operation === 'subtraction' ? [first + second, first]
        : operation === 'division' ? [first * second, first] : [first, second];

describe.each(operations)('unspecified-bound %s widths', operation => {
    it('partitions the original pair law without enumerating the large range', () => {
        const bound = 100;
        const additive = operation === 'addition' || operation === 'subtraction';
        const firstCount = additive ? bound - 1 : bound;
        const rows = unboundedSingleDigitRows(operation, bound);
        const mass = rows.reduce((sum, row) => sum + row.weight, 0);
        let expectedMass = 0, singleCount = 0, cumulative = 0;
        const random = vi.spyOn(rng, 'random');
        for (let first = 1; first <= firstCount; first++) {
            const secondCount = additive ? bound - first : Math.floor(bound / first);
            for (let second = 1; second <= secondCount; second++) {
                const pair = operands(operation, first, second);
                if (Math.max(...pair) < 10) {
                    singleCount++;
                    expectedMass += 1 / firstCount / secondCount;
                } else {
                    random.mockReturnValueOnce((first - 0.5) / firstCount)
                        .mockReturnValueOnce((second - 0.5) / secondCount);
                    expect(sampleUnboundedOperandWidthPair(operation, 'multiple', bound)).toEqual(pair);
                }
            }
        }
        expect(rows.reduce((sum, row) => sum + row.high, 0)).toBe(singleCount);
        expect(mass).toBeCloseTo(expectedMass, 14);
        for (const row of rows) {
            for (let second = 1; second <= row.high; second++) {
                random.mockReturnValueOnce((cumulative + row.weight / 2) / mass)
                    .mockReturnValueOnce((second - 0.5) / row.high);
                expect(sampleUnboundedOperandWidthPair(operation, 'single', bound))
                    .toEqual(operands(operation, row.first, second));
            }
            cumulative += row.weight;
        }
    });

    it('uses at most nine rows at the safe-integer boundary and keeps every term exact', () => {
        const rows = unboundedSingleDigitRows(operation);
        expect(rows.length).toBeLessThanOrEqual(9);
        expect(rows.reduce((sum, row) => sum + row.high, 0)).toBe(
            operation === 'subtraction' ? 36 : operation === 'division' ? 23 : 81);
        for (const width of ['single', 'multiple'] as const) {
            for (let seed = 0; seed < 100; seed++) {
                rng.setSeed(seed);
                const pair = sampleUnboundedOperandWidthPair(operation, width)!;
                expect(pair).not.toBeNull();
                const [first, second] = pair;
                expect(pair.every(value => Number.isSafeInteger(value) && value > 0)).toBe(true);
                expect(Math.max(...pair) < 10).toBe(width === 'single');
                const result = operation === 'addition' ? first + second
                    : operation === 'subtraction' ? first - second
                        : operation === 'multiplication' ? first * second : first / second;
                expect(Number.isSafeInteger(result)).toBe(true);
                expect(result).toBeGreaterThan(0);
            }
        }
        const random = vi.spyOn(rng, 'random').mockReturnValue(1 - Number.EPSILON);
        const pair = sampleUnboundedOperandWidthPair(operation, 'multiple')!;
        expect(pair.every(Number.isSafeInteger)).toBe(true);
        expect(pair.some(value => value > 1_000_000)).toBe(true);
        expect(random).toHaveBeenCalledTimes(2);
    });

    it('bounds complement rejection and does not hang on a pathological RNG stream', () => {
        const random = vi.spyOn(rng, 'random').mockReturnValue(0);
        expect(sampleUnboundedOperandWidthPair(operation, 'multiple')).toBeNull();
        expect(random).toHaveBeenCalledTimes(64);
        random.mockClear().mockReturnValueOnce(0).mockReturnValueOnce(0)
            .mockReturnValueOnce(0.5).mockReturnValueOnce(0.5);
        expect(Math.max(...sampleUnboundedOperandWidthPair(operation, 'multiple')!)).toBeGreaterThanOrEqual(10);
        expect(random).toHaveBeenCalledTimes(4);
    });

    it('rejects an invalid safe-integer domain', () => {
        expect(unboundedSingleDigitRows(operation, Infinity)).toEqual([]);
        expect(sampleUnboundedOperandWidthPair(operation, 'single', 1)).toBeNull();
        expect(sampleUnboundedOperandWidthPair(operation, 'multiple', Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    });
});
