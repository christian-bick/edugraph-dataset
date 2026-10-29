import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {CountingBasicGenerator} from '../counting-basic/generator.ts';
import {ParityGroupingGenerator} from './generator.ts';

describe('ParityGroupingGenerator', () => {
    const generator = new ParityGroupingGenerator();
    afterEach(() => vi.restoreAllMocks());

    it('uses the counting problem family and strictly validates its configuration', () => {
        expect(generator.type).toBe('counting');
        for (const config of [{}, {range: {min: 0, max: 20}}, {parity: 'any'},
            {range: {}, parity: 'any'}, {range: {min: 0.5, max: 20}, parity: 'odd'},
            {range: {min: 0, max: Infinity}, parity: 'even'},
            {range: {min: 0, max: 20}, parity: 'prime'}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it('retains every original collection and its exact random continuation', () => {
        const old = new CountingBasicGenerator();
        for (const parity of ['any', 'even', 'odd'] as const) for (const range of [
            {min: 0, max: 20}, {min: 5, max: 10}, {min: 1, max: 1}, {min: 20, max: 20}
        ]) for (let seed = 0; seed < 128; seed++) {
            randomness.setSeed(seed);
            const previous = old.generate({range, parity});
            const previousState = randomness.getRandomState();
            randomness.setSeed(seed);
            const current = generator.generate({range, parity});
            expect(randomness.getRandomState()).toBe(previousState);
            if (!previous) { expect(current).toBeNull(); continue; }
            const count = previous.data.numObjects;
            expect(current).toEqual({data: {kind: 'parity-grouping', numObjects: count,
                groupSize: Math.floor(count / 2), remainder: count % 2,
                parity: count % 2 === 0 ? 'even' : 'odd'}});
        }
    });

    it('preserves all ten equally weighted odd/even count bins without a singleton profile', () => {
        const draw = vi.spyOn(randomness, 'random');
        for (const parity of ['odd', 'even'] as const) {
            const counts = [];
            for (let bin = 0; bin < 10; bin++) {
                draw.mockReturnValue((bin + 0.5) / 10);
                const result = generator.generate({range: {min: 0, max: 20}, parity})!;
                counts.push(result.data.numObjects);
                expect(result.data.numObjects).toBe(2 * bin + (parity === 'odd' ? 1 : 2));
            }
            expect(new Set(counts).size).toBe(10);
            expect(counts.filter(count => count === 1)).toHaveLength(parity === 'odd' ? 1 : 0);
        }
        expect(draw).toHaveBeenCalledTimes(20);
    });

    it('retains singleton, even and larger odd canonical witnesses', () => {
        for (const [count, groupSize, remainder, parity] of [[1, 0, 1, 'odd'], [2, 1, 0, 'even'],
            [3, 1, 1, 'odd'], [20, 10, 0, 'even']] as const) {
            expect(generator.generate({range: {min: count, max: count}, parity})).toEqual({data: {
                kind: 'parity-grouping', numObjects: count, groupSize, remainder, parity
            }});
        }
    });

    it('retains the existing task capacity and returns null without entropy for an empty domain', () => {
        const draw = vi.spyOn(randomness, 'random').mockReturnValue(1 - 2 ** -32);
        expect(generator.generate({range: {min: -5, max: 100}, parity: 'any'})!.data.numObjects).toBe(20);
        draw.mockClear();
        for (const [range, parity] of [[{min: 21, max: 100}, 'any'], [{min: 1, max: 1}, 'even'],
            [{min: 20, max: 10}, 'odd']] as const) expect(generator.generate({range, parity})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
