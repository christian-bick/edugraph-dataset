import {afterEach, describe, expect, it, vi} from 'vitest';
import * as prng from '../../lib/random.ts';
import {samplePositiveWholeNumber} from './whole-number-values.ts';

afterEach(() => vi.restoreAllMocks());

describe('positive whole-number sampling', () => {
    it('covers every 1..100 bin using equally spaced interior points and one draw', () => {
        const random = vi.spyOn(prng, 'random');
        for (let index = 0; index < 100; index++) {
            for (const fraction of [0.001, 0.999]) {
                random.mockReturnValue((index + fraction) / 100);
                const before = random.mock.calls.length;
                expect(samplePositiveWholeNumber({min: 0, max: 100})).toBe(index + 1);
                expect(random.mock.calls.length - before).toBe(1);
            }
        }
    });

    it('retains the writer\'s inclusive formula, integer bounds and exact continuation', () => {
        for (const range of [{min: 0, max: 100}, {min: 10.2, max: 20.9},
            {min: -10, max: 5}, {min: 1001, max: 1_000_000}, {min: 37, max: 37}]) {
            for (let seed = 0; seed < 16; seed++) {
                prng.setSeed(seed);
                const minimum = Math.max(1, Math.ceil(range.min));
                const maximum = Math.floor(range.max);
                const expected = Math.floor(prng.random() * (maximum - minimum + 1)) + minimum;
                const continuation = prng.getRandomState();
                prng.setSeed(seed);
                expect(samplePositiveWholeNumber(range)).toBe(expected);
                expect(prng.getRandomState()).toBe(continuation);
            }
        }
    });

    it('leaves random continuation unchanged for an empty positive-integer domain', () => {
        for (const range of [{min: 0, max: 0}, {min: 4, max: 3}, {min: 1.1, max: 1.9}]) {
            prng.setSeed(53);
            const before = prng.getRandomState();
            expect(samplePositiveWholeNumber(range)).toBeNull();
            expect(prng.getRandomState()).toBe(before);
        }
    });
});
