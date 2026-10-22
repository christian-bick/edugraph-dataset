import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
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

describe('full common-factor distribution required magnitude configuration', () => {
    it('rejects empty and malformed configuration', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        for (const range of [null, undefined, 100, '100', [], {}, {min: 1, max: 100}, {min: -1, max: 100},
            {min: 0, max: 10}, {min: 0, max: 200}, {min: 0, max: 100.5}, {min: 0, max: Infinity}]) {
            expect(() => generator.generate({range} as never)).toThrow(GeneratorValidationError);
        }
    });

    it('bounds all task values, including the sum and full witnesses, under each admitted range', () => {
        const features = new Set<string>();
        for (const max of [100, 1000, Number.MAX_SAFE_INTEGER]) {
            const cap = max === Number.MAX_SAFE_INTEGER ? 200 : max;
            for (let seed = 0; seed < 200; seed++) {
                setSeed(seed);
                const {data} = generator.generate({range: {min: 0, max}});
                for (const value of [...data.addends, data.sum, ...data.commonDivisors, data.gcd,
                    ...data.residualAddends, data.residualSum, ...data.residualCommonDivisors, ...data.distributedProducts]) {
                    expect(Number.isSafeInteger(value)).toBe(true);
                    expect(value).toBeGreaterThan(0);
                    expect(value).toBeLessThanOrEqual(cap);
                }
                expect(data.addends.every(value => value <= 100)).toBe(true);
                expect(data.gcd).toBeGreaterThan(1);
                if (data.sum > 100) features.add('larger-sum');
                if (data.sum === 100 && max === 100) features.add('inclusive-boundary');
                if (data.addends[0] === data.addends[1]) features.add('equal');
                if (data.addends.includes(100)) features.add('input-boundary');
            }
        }
        expect([...features].sort()).toEqual(['equal', 'inclusive-boundary', 'input-boundary', 'larger-sum']);
    });

    it('makes range 100 genuinely narrower while preserving deterministic unbounded-domain replay', () => {
        let differs = false;
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const smaller = generator.generate({range: {min: 0, max: 100}});
            setSeed(seed);
            const larger = generator.generate({range: {min: 0, max: 1000}});
            setSeed(seed);
            expect(generator.generate({range: {min: 0, max: Number.MAX_SAFE_INTEGER}})).toEqual(larger);
            expect(Object.keys(larger)).toEqual(['data']);
            expect(smaller.data.sum).toBeLessThanOrEqual(100);
            if (larger.data.sum > 100) differs = true;
        }
        expect(differs).toBe(true);
    });
});
