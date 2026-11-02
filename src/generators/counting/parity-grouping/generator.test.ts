import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {ParityGroupingGenerator} from './generator.ts';
import {groupingCountingProfiles} from '../canonical-counting-domains.ts';

describe('ParityGroupingGenerator', () => {
    const generator = new ParityGroupingGenerator();
    afterEach(() => vi.restoreAllMocks());
    it('strictly validates required fields, integer bounds and supported grouping profiles', () => {
        expect(generator.type).toBe('counting');
        for (const config of [{}, {range: createCanonicalNumericRange(20)}, {parity: 'even'}, {range: {}, parity: 'even'},
            {range: null, parity: 'even'}, {range: {min: .5, max: 20}, parity: 'positive-odd'},
            {range: {min: 0, max: Infinity}, parity: 'even'}, {range: createCanonicalNumericRange(20), parity: 'any'}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });
    it('retains all twenty counts uniformly inside each canonical grouping profile with one draw', () => {
        const draw = vi.spyOn(randomness, 'random');
        const union = new Set<number>();
        for (const parity of ['even', 'singleton-odd', 'positive-odd'] as const) {
            for (const {range} of groupingCountingProfiles) {
                const expected = Array.from({length: 20}, (_, index) => index + 1).filter(count =>
                    count > range.maximumAbove && count <= range.max && (parity === 'even' ? count % 2 === 0
                        : parity === 'singleton-odd' ? count === 1 : count >= 3 && count % 2 === 1));
                draw.mockClear();
                if (!expected.length) {
                    expect(generator.generate({range, parity})).toBeNull();
                    expect(draw).not.toHaveBeenCalled(); continue;
                }
                for (let index = 0; index < expected.length; index++) {
                    draw.mockReturnValue((index + .5) / expected.length);
                    const count = expected[index]!;
                    expect(generator.generate({range, parity})).toEqual({data: {
                        kind: 'parity-grouping', numObjects: count, groupSize: Math.floor(count / 2),
                        remainder: count % 2, parity: count % 2 ? 'odd' : 'even'}});
                    union.add(count);
                }
                expect(draw).toHaveBeenCalledTimes(expected.length);
            }
        }
        expect([...union].sort((a, b) => a - b)).toEqual(Array.from({length: 20}, (_, index) => index + 1));
    });
    it('replays every feasible range/profile with exactly one draw', () => {
        for (const {range} of groupingCountingProfiles) for (const parity of ['even', 'positive-odd'] as const) {
            for (let seed = 0; seed < 32; seed++) {
                randomness.setSeed(seed); randomness.random(); const continuation = randomness.getRandomState();
                randomness.setSeed(seed); const first = generator.generate({range, parity});
                expect(first).not.toBeNull(); expect(randomness.getRandomState()).toBe(continuation);
                randomness.setSeed(seed); expect(generator.generate({range, parity})).toEqual(first);
            }
        }
    });
    it('rejects unavailable singleton/high-band and noncanonical ranges without entropy', () => {
        const draw = vi.spyOn(randomness, 'random');
        expect(generator.generate({range: createCanonicalNumericRange(10), parity: 'singleton-odd'})).toBeNull();
        expect(generator.generate({range: createCanonicalNumericRange(20), parity: 'singleton-odd'})).toBeNull();
        expect(generator.generate({range: {min: 0, max: 20} as never, parity: 'even'})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
