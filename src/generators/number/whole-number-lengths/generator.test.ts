import {afterEach, describe, expect, it, vi} from 'vitest';
import * as prng from '../../../lib/random.ts';
import {createCanonicalNumericRange, CANONICAL_RANGE_THRESHOLDS,
    hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {WholeNumberLengthsGenerator} from './generator.ts';

const generator = new WholeNumberLengthsGenerator();
afterEach(() => vi.restoreAllMocks());

describe('WholeNumberLengthsGenerator', () => {
    it('requires the complete range configuration', () => {
        expect(() => generator.generate({})).toThrow(/Required field "range"/);
        expect(() => generator.generate(null as never)).toThrow(/Configuration/);
    });

    it('contains the numerical origin independently of the positive sampled endpoint', () => {
        for (const max of CANONICAL_RANGE_THRESHOLDS) {
            for (let seed = 0; seed < 16; seed++) {
                prng.setSeed(seed);
                const range = createCanonicalNumericRange(max);
                const stub = generator.generate({range})!;
                expect(Object.keys(stub)).toEqual(['data']);
                expect(stub.data).toEqual({kind: 'whole-number-length', origin: 0,
                    endpoint: expect.any(Number), unit: 1});
                expect(Number.isInteger(stub.data.endpoint)).toBe(true);
                expect(stub.data.endpoint).toBeGreaterThanOrEqual(1);
                expect(stub.data.endpoint).toBeLessThanOrEqual(max);
                expect(hasCanonicalRangeWitness([0, 1, stub.data.endpoint], range)).toBe(true);
                expect(stub.data).not.toHaveProperty('labels');
                expect(stub.data).not.toHaveProperty('answer');
            }
        }
    });

    it('partitions all original 1..100 endpoints exactly once with inclusive boundaries and one draw', () => {
        const random = vi.spyOn(prng, 'random');
        const endpoints: number[] = [];
        for (const upper of [5, 10, 20, 100]) {
            const range = createCanonicalNumericRange(upper);
            const minimum = Math.max(1, range.maximumAbove + 1);
            for (let endpoint = minimum; endpoint <= upper; endpoint++) {
                random.mockReturnValue((endpoint - minimum + 0.5) / (upper - minimum + 1));
                const data = generator.generate({range})!.data;
                expect(data.endpoint).toBe(endpoint);
                expect(hasCanonicalRangeWitness([data.origin, data.unit, data.endpoint], range)).toBe(true);
                endpoints.push(data.endpoint);
            }
        }
        expect(endpoints).toEqual(Array.from({length: 100}, (_, index) => index + 1));
        expect(random).toHaveBeenCalledTimes(100);
    });

    it('rejects bounds that exclude the origin or have no supported endpoint without drawing', () => {
        for (const range of [{...createCanonicalNumericRange(100), min: 1}, {min: 0, max: 0}, {min: 0, max: -1},
            {min: NaN, max: 100}, {min: 0, max: Infinity}, {min: 0, max: Number.MAX_SAFE_INTEGER + 1},
            {min: 0, max: 100}, {...createCanonicalNumericRange(100), minimumBelow: 10},
            {...createCanonicalNumericRange(100), maximumAbove: 10}]) {
            prng.setSeed(73);
            const before = prng.getRandomState();
            expect(generator.generate({range} as never)).toBeNull();
            expect(prng.getRandomState()).toBe(before);
        }
    });

    it('is deterministic and consumes a single draw per resolved band', () => {
        prng.setSeed(81);
        prng.random();
        const continuation = prng.getRandomState();
        prng.setSeed(81);
        const range = createCanonicalNumericRange(5);
        const first = generator.generate({range});
        expect(prng.getRandomState()).toBe(continuation);
        prng.setSeed(81);
        expect(generator.generate({range})).toEqual(first);
    });
});
