import {afterEach, describe, expect, it, vi} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {buildFullCommonFactorDistributionProblem, CommonFactorDistributionRelationsGenerator} from './generator.ts';

const generator = new CommonFactorDistributionRelationsGenerator();
const directCommonDivisors = (first: number, second: number): number[] =>
    Array.from({length: Math.min(first, second)}, (_, index) => index + 1)
        .filter(divisor => first % divisor === 0 && second % divisor === 0);

describe('full common-factor distribution mathematical witnesses', () => {
    it('extracts the full factor of 36+8 with complete common and residual divisor evidence', () => {
        expect(buildFullCommonFactorDistributionProblem(36, 8)).toEqual({
            kind: 'full-common-factor-distribution', addends: [36, 8], sum: 44,
            commonDivisors: [1, 2, 4], gcd: 4, residualAddends: [9, 2], residualSum: 11,
            residualCommonDivisors: [1], distributedProducts: [36, 8]
        });
    });

    it.each([
        [100, 100, 100, 1, 1, 200], [50, 50, 50, 1, 1, 100],
        [100, 50, 50, 2, 1, 150], [84, 36, 12, 7, 3, 120],
        [98, 100, 2, 49, 50, 198], [2, 2, 2, 1, 1, 4]
    ])('proves full extraction from %i + %i', (first, second, gcd, u, v, sum) => {
        const data = buildFullCommonFactorDistributionProblem(first, second);
        expect(data).toMatchObject({gcd, residualAddends: [u, v], sum, residualSum: u + v,
            distributedProducts: [first, second], residualCommonDivisors: [1]});
        if (gcd === 100) expect(data.commonDivisors).toEqual([1, 2, 4, 5, 10, 20, 25, 50, 100]);
    });

    it('preserves original operand order under swapping', () => {
        const first = buildFullCommonFactorDistributionProblem(36, 8);
        const second = buildFullCommonFactorDistributionProblem(8, 36);
        expect(second.addends).toEqual([8, 36]);
        expect(second.residualAddends).toEqual([2, 9]);
        expect(second.distributedProducts).toEqual([8, 36]);
        expect(second.commonDivisors).toEqual(first.commonDivisors);
        expect(second.sum).toBe(first.sum);
    });

    it('independently proves all 3913 admitted positive ordered pairs and the 1907 smaller-range subset', () => {
        let fullCount = 0;
        let smallerCount = 0;
        for (let first = 1; first <= 100; first++) {
            for (let second = 1; second <= 100; second++) {
                const expected = directCommonDivisors(first, second);
                if (expected.length === 1) continue;
                const data = buildFullCommonFactorDistributionProblem(first, second);
                expect(data.addends).toEqual([first, second]);
                expect(data.commonDivisors).toEqual(expected);
                expect(data.gcd).toBe(expected[expected.length - 1]);
                expect(data.gcd).toBeGreaterThan(1);
                expect(data.residualAddends).toEqual([first / data.gcd, second / data.gcd]);
                expect(data.residualCommonDivisors).toEqual(directCommonDivisors(...data.residualAddends));
                expect(data.residualCommonDivisors).toEqual([1]);
                expect(data.distributedProducts).toEqual([data.gcd * data.residualAddends[0], data.gcd * data.residualAddends[1]]);
                expect(data.distributedProducts).toEqual(data.addends);
                expect(data.sum).toBe(first + second);
                expect(data.sum).toBe(data.gcd * data.residualSum);
                fullCount++;
                if (data.sum <= 100) smallerCount++;
            }
        }
        expect(fullCount).toBe(3913);
        expect(smallerCount).toBe(1907);
    });

    it.each([
        [0, 8], [-0, 8], [-1, 8], [1.5, 8], [101, 8], [NaN, 8], [Infinity, 8],
        [8, 0], [8, -1], [8, 1.5], [8, 101], [8, NaN], [8, Infinity],
        [Number.MAX_SAFE_INTEGER + 1, 8], [1, 1], [36, 7]
    ])('rejects invalid or trivial-factor originals %s and %s', (first, second) => {
        expect(() => buildFullCommonFactorDistributionProblem(first, second)).toThrow(GeneratorValidationError);
    });
});

afterEach(() => vi.restoreAllMocks());

describe('full common-factor distribution required canonical magnitude', () => {
    it('retains all 3913 original ordered pairs exactly once across six canonical bands', () => {
        const random = vi.spyOn(rng, 'random');
        const covered = new Set<string>();
        for (const upper of [5, 10, 20, 100, 120, 1000]) {
            const range = createCanonicalNumericRange(upper);
            const pairs: [number, number][] = [];
            for (let first = 1; first <= 100; first++) for (let second = 1; second <= 100; second++) {
                if (first + second > range.maximumAbove && first + second <= upper
                    && directCommonDivisors(first, second).length > 1) pairs.push([first, second]);
            }
            for (const [index, pair] of pairs.entries()) {
                random.mockReset().mockReturnValue((index + 0.5) / pairs.length);
                const {data} = generator.generate({range});
                expect(random).toHaveBeenCalledTimes(1);
                expect(data.addends).toEqual(pair);
                expect(hasCanonicalRangeWitness([...data.addends, data.sum, ...data.commonDivisors, data.gcd,
                    ...data.residualAddends, data.residualSum, ...data.residualCommonDivisors,
                    ...data.distributedProducts], range)).toBe(true);
                const key = pair.join(':');
                expect(covered.has(key)).toBe(false);
                covered.add(key);
            }
        }
        const original = new Set<string>();
        for (let first = 1; first <= 100; first++) for (let second = 1; second <= 100; second++) {
            if (directCommonDivisors(first, second).length > 1) original.add(`${first}:${second}`);
        }
        expect(covered).toEqual(original);
        expect(covered.size).toBe(3913);
    });

    it('rejects malformed bounds and absent witnesses before consuming randomness', () => {
        const random = vi.spyOn(rng, 'random');
        for (const config of [undefined, {}, ...[null, undefined, 100, '100', [], {},
            {min: 0, max: 100}, createCanonicalNumericRange(100, 5),
            {min: 0, max: 200}, {min: 0, max: Number.MAX_SAFE_INTEGER}].map(range => ({range}))]) {
            expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
        }
        expect(random).not.toHaveBeenCalled();
    });

    it('replays deterministically and keeps complete proof arrays independent between draws', () => {
        const config = {range: createCanonicalNumericRange(120)};
        rng.setSeed(731);
        const first = generator.generate(config);
        const expected = structuredClone(first);
        const continuation = rng.getRandomState();
        (first.data.commonDivisors as number[]).push(999);
        rng.setSeed(731);
        expect(generator.generate(config)).toEqual(expected);
        expect(rng.getRandomState()).toBe(continuation);
        expect(Object.keys(first)).toEqual(['data']);
    });
});
