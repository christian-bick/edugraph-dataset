import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomness from '../../../lib/random.ts';
import {CountingBasicGenerator} from '../counting-basic/generator.ts';
import {ParityGroupingGenerator} from './generator.ts';

describe('ParityGroupingGenerator', () => {
    const generator = new ParityGroupingGenerator();
    afterEach(() => vi.restoreAllMocks());

    it('uses the counting problem family and strictly validates its configuration', () => {
        expect(generator.type).toBe('counting');
        for (const config of [{}, {range: {min: 0, max: 20}}, {parity: 'even'},
            {range: {}, parity: 'even'}, {range: null, parity: 'even'},
            {range: {min: 0.5, max: 20}, parity: 'positive-odd'},
            {range: {min: 0, max: Infinity}, parity: 'even'},
            {range: {min: 0, max: Number.MAX_SAFE_INTEGER + 1}, parity: 'even'},
            {range: {min: 0, max: 20}, parity: 'any'}, {range: {min: 0, max: 20}, parity: 'odd'},
            {range: {min: 0, max: 20}, parity: 'prime'}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it('keeps the original scalar distribution and random continuation within each profile', () => {
        const old = new CountingBasicGenerator();
        for (const profile of ['even', 'singleton-odd', 'positive-odd'] as const) for (const range of [
            {min: 0, max: 20}, {min: 5, max: 10}, {min: 1, max: 1}, {min: 20, max: 20}
        ]) for (let seed = 0; seed < 128; seed++) {
            randomness.setSeed(seed);
            const previous = old.generate({range: {min: Math.max(profile === 'positive-odd' ? 3 : 1, range.min),
                max: Math.min(profile === 'singleton-odd' ? 1 : 20, range.max)}, parity: profile === 'even' ? 'even' : 'odd'});
            const previousState = randomness.getRandomState();
            randomness.setSeed(seed);
            const current = generator.generate({range, parity: profile});
            expect(randomness.getRandomState()).toBe(previousState);
            if (!previous) { expect(current).toBeNull(); continue; }
            const count = previous.data.numObjects;
            expect(current).toEqual({data: {kind: 'parity-grouping', numObjects: count,
                groupSize: Math.floor(count / 2), remainder: count % 2,
                parity: count % 2 === 0 ? 'even' : 'odd'}});
        }
    });

    it('retains every original count with one scalar draw and uniform bins inside each profile', () => {
        const draw = vi.spyOn(randomness, 'random');
        const union = new Set<number>();
        for (const [parity, expected] of [['even', [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]],
            ['singleton-odd', [1]], ['positive-odd', [3, 5, 7, 9, 11, 13, 15, 17, 19]]] as const) {
            const counts = [];
            for (let bin = 0; bin < expected.length; bin++) {
                draw.mockReturnValue((bin + 0.5) / expected.length);
                const result = generator.generate({range: {min: 0, max: 20}, parity})!;
                counts.push(result.data.numObjects);
                union.add(result.data.numObjects);
                expect(result.data.numObjects).toBe(expected[bin]);
                expect([result.data.groupSize, result.data.remainder].includes(0)).toBe(parity !== 'positive-odd');
            }
            expect(counts).toEqual(expected);
        }
        expect([...union].sort((a, b) => a - b)).toEqual(Array.from({length: 20}, (_, index) => index + 1));
        expect(draw).toHaveBeenCalledTimes(20);
    });

    it('retains singleton, even and larger odd canonical witnesses', () => {
        for (const [count, groupSize, remainder, profile] of [[1, 0, 1, 'singleton-odd'], [2, 1, 0, 'even'],
            [3, 1, 1, 'positive-odd'], [20, 10, 0, 'even']] as const) {
            expect(generator.generate({range: {min: count, max: count}, parity: profile})).toEqual({data: {
                kind: 'parity-grouping', numObjects: count, groupSize, remainder, parity: remainder ? 'odd' : 'even'
            }});
        }
    });

    it('retains the existing task capacity and returns null without entropy for an empty domain', () => {
        const draw = vi.spyOn(randomness, 'random').mockReturnValue(1 - 2 ** -32);
        expect(generator.generate({range: {min: -5, max: 100}, parity: 'even'})!.data.numObjects).toBe(20);
        expect(generator.generate({range: {min: -5, max: 100}, parity: 'positive-odd'})!.data.numObjects).toBe(19);
        expect(generator.generate({range: {min: -5, max: 100}, parity: 'singleton-odd'})!.data.numObjects).toBe(1);
        draw.mockClear();
        for (const [range, parity] of [[{min: 21, max: 100}, 'even'], [{min: 1, max: 1}, 'even'],
            [{min: 20, max: 10}, 'positive-odd'], [{min: 1, max: 1}, 'positive-odd'],
            [{min: 2, max: 20}, 'singleton-odd'], [{min: -5, max: 0}, 'singleton-odd']] as const) {
            expect(generator.generate({range, parity})).toBeNull();
        }
        expect(draw).not.toHaveBeenCalled();
    });

    it('intersects every bounded integer interval with the exact three finite profile domains', () => {
        const draw = vi.spyOn(randomness, 'random');
        for (let min = -1; min <= 22; min++) for (let max = -1; max <= 22; max++) {
            for (const parity of ['even', 'singleton-odd', 'positive-odd'] as const) {
                const expected = Array.from({length: 20}, (_, index) => index + 1).filter(count =>
                    count >= min && count <= max && (parity === 'even' ? count % 2 === 0
                        : parity === 'singleton-odd' ? count === 1 : count >= 3 && count % 2 === 1));
                draw.mockClear();
                if (!expected.length) {
                    expect(generator.generate({range: {min, max}, parity})).toBeNull();
                    expect(draw).not.toHaveBeenCalled();
                    continue;
                }
                const actual = expected.map((_, index) => {
                    draw.mockReturnValue((index + 0.5) / expected.length);
                    return generator.generate({range: {min, max}, parity})!.data.numObjects;
                });
                expect(actual).toEqual(expected);
                expect(draw).toHaveBeenCalledTimes(expected.length);
            }
        }
    });
});
