import {afterEach, describe, expect, it, vi} from 'vitest';
import * as prng from '../../../lib/random.ts';
import {WholeNumberLengthsGenerator} from './generator.ts';

const generator = new WholeNumberLengthsGenerator();
afterEach(() => vi.restoreAllMocks());

describe('WholeNumberLengthsGenerator', () => {
    it('requires the complete range configuration', () => {
        expect(() => generator.generate({})).toThrow(/Required field "range"/);
        expect(() => generator.generate(null as never)).toThrow(/Configuration/);
    });

    it('contains the numerical origin independently of the positive sampled endpoint', () => {
        for (const max of [1, 5, 10, 20, 100, 120, 1000, 1_000_000]) {
            for (let seed = 0; seed < 16; seed++) {
                prng.setSeed(seed);
                const stub = generator.generate({range: {min: 0, max}})!;
                expect(Object.keys(stub)).toEqual(['data']);
                expect(stub.data).toEqual({kind: 'whole-number-length', origin: 0,
                    endpoint: expect.any(Number), unit: 1});
                expect(Number.isInteger(stub.data.endpoint)).toBe(true);
                expect(stub.data.endpoint).toBeGreaterThanOrEqual(1);
                expect(stub.data.endpoint).toBeLessThanOrEqual(max);
                expect(stub.data).not.toHaveProperty('labels');
                expect(stub.data).not.toHaveProperty('answer');
            }
        }
    });

    it('preserves both inclusive endpoint boundaries through 100', () => {
        const random = vi.spyOn(prng, 'random');
        random.mockReturnValue(0);
        expect(generator.generate({range: {min: 0, max: 100}})!.data.endpoint).toBe(1);
        random.mockReturnValue(0.999999999);
        expect(generator.generate({range: {min: 0, max: 100}})!.data.endpoint).toBe(100);
        expect(random).toHaveBeenCalledTimes(2);
    });

    it('rejects bounds that exclude the origin or have no supported endpoint without drawing', () => {
        for (const range of [{min: 1, max: 100}, {min: 0, max: 0}, {min: 0, max: -1},
            {min: NaN, max: 100}, {min: 0, max: Infinity}, {min: 0, max: Number.MAX_SAFE_INTEGER + 1}]) {
            prng.setSeed(73);
            const before = prng.getRandomState();
            expect(generator.generate({range})).toBeNull();
            expect(prng.getRandomState()).toBe(before);
        }
        expect(generator.generate({range: {min: -1, max: 1}})!.data.endpoint).toBe(1);
    });

    it('is deterministic and consumes the same single draw for a singleton domain', () => {
        prng.setSeed(81);
        prng.random();
        const continuation = prng.getRandomState();
        prng.setSeed(81);
        const first = generator.generate({range: {min: 0, max: 1}});
        expect(prng.getRandomState()).toBe(continuation);
        prng.setSeed(81);
        expect(generator.generate({range: {min: 0, max: 1}})).toEqual(first);
    });
});
