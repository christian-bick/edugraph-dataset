import {afterEach, describe, expect, it, vi} from 'vitest';
import * as randomSource from '../../../lib/random.ts';
import {CountingSelectionGenerator} from './generator.ts';

describe('CountingSelectionGenerator', () => {
    const generator = new CountingSelectionGenerator();
    afterEach(() => vi.restoreAllMocks());

    it('requires both range and subset parity configuration', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: {min: 0, max: 10}})).toThrow('parity');
        expect(() => generator.generate({parity: 'any'})).toThrow('range');
    });

    it('is deterministic and consumes the requested-count draw before the supply draw', () => {
        const config = {range: {min: 5, max: 20}, parity: 'any' as const};
        randomSource.setSeed(42);
        randomSource.random();
        randomSource.random();
        const afterTwoDraws = randomSource.getRandomState();
        randomSource.setSeed(42);
        const first = generator.generate(config)!;
        expect(first.data.numObjects).toBe(14);
        expect(randomSource.getRandomState()).toBe(afterTwoDraws);
        randomSource.setSeed(42);
        expect(generator.generate(config)).toEqual(first);
        expect(randomSource.getRandomState()).toBe(afterTwoDraws);
    });

    it('samples every available count from the full inclusive interval with equal entropy intervals', () => {
        for (let index = 0; index < 6; index++) {
            const draw = vi.spyOn(randomSource, 'random')
                .mockReturnValueOnce(0.4)
                .mockReturnValueOnce((index + 0.5) / 6);
            const data = generator.generate({range: {min: 1, max: 10}, parity: 'any'})!.data;
            expect(data.numObjects).toBe(5);
            expect(data.availableCount).toBe(5 + index);
            expect(draw).toHaveBeenCalledTimes(2);
            draw.mockRestore();
        }
    });

    it.each([0, 0.999])('allows equal cardinalities away from the maximum and at it: draw %s', firstDraw => {
        vi.spyOn(randomSource, 'random').mockReturnValueOnce(firstDraw).mockReturnValueOnce(0);
        const data = generator.generate({range: {min: 5, max: 10}, parity: 'any'})!.data;
        expect(data.numObjects).toBe(firstDraw === 0 ? 5 : 10);
        expect(data.availableCount).toBe(data.numObjects);
        expect(data.simpleAnswer).toBe(data.numObjects);
        expect(Object.keys(data).sort()).toEqual(['availableCount', 'numObjects', 'simpleAnswer']);
    });

    it.each(['any', 'even', 'odd'] as const)('bounds both cardinalities for subset parity %s', parity => {
        for (const range of [{min: 0, max: 10}, {min: 5, max: 20}, {min: 10, max: 20}]) {
            for (let seed = 0; seed < 40; seed++) {
                randomSource.setSeed(seed);
                const data = generator.generate({range, parity})!.data;
                for (const count of [data.numObjects, data.availableCount]) {
                    expect(Number.isInteger(count)).toBe(true);
                    expect(count).toBeGreaterThanOrEqual(Math.max(1, range.min));
                    expect(count).toBeLessThanOrEqual(range.max);
                }
                expect(data.availableCount).toBeGreaterThanOrEqual(data.numObjects);
                if (parity !== 'any') {
                    expect(data.parity).toBe(parity);
                    expect(data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
                }
            }
        }
    });

    it.each([
        ['even', 2, 3],
        ['odd', 1, 2]
    ] as const)('does not apply subset parity %s to the available collection', (parity, requested, available) => {
        vi.spyOn(randomSource, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.3);
        const data = generator.generate({range: {min: 1, max: 5}, parity})!.data;
        expect(data.numObjects).toBe(requested);
        expect(data.availableCount).toBe(available);
        expect(data.parity).toBe(parity);
    });

    it('supports a singleton range with equal requested and available counts', () => {
        expect(generator.generate({range: {min: 5, max: 5}, parity: 'odd'})!.data)
            .toEqual({numObjects: 5, availableCount: 5, simpleAnswer: 5, parity: 'odd'});
    });

    it.each([
        {min: 10, max: 5}, {min: 0, max: 0}, {min: -2, max: -1},
        {min: 1.5, max: 10}, {min: 1, max: 10.5},
        {min: NaN, max: 10}, {min: 1, max: Infinity},
        {min: -Infinity, max: 10}, {min: 1, max: Number.MAX_SAFE_INTEGER + 1}
    ])('rejects invalid or empty integer bounds without drawing: %j', range => {
        const draw = vi.spyOn(randomSource, 'random');
        expect(generator.generate({range, parity: 'any'})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });

    it('rejects an infeasible subset parity without drawing a supply', () => {
        const draw = vi.spyOn(randomSource, 'random');
        expect(generator.generate({range: {min: 1, max: 1}, parity: 'even'})).toBeNull();
        expect(draw).not.toHaveBeenCalled();
    });
});
