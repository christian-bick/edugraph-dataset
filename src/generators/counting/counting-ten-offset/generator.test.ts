import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CountingTenOffsetGenerator} from './generator.ts';

describe('CountingTenOffsetGenerator', () => {
    const generator = new CountingTenOffsetGenerator();

    it('generates complete, consistent counting-ten-offset evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 1, max: 999}, direction: 'inc'})!.data;
            expect(data.stepSize).toBe(10);
            expect(data.incDecAnswer).toBe(data.numObjects + 10);
            const start = data.startPlaceValue;
            const result = data.resultPlaceValue;
            expect(data.numObjects).toBe((start.hundreds ?? 0) * 100 + start.tens * 10 + start.ones);
            expect(data.incDecAnswer).toBe((result.hundreds ?? 0) * 100 + result.tens * 10 + result.ones);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('counting-ten-offset');
        const first = generator.generate({range: {min: 1, max: 999}, direction: 'inc'});
        setSeed('counting-ten-offset');
        expect(generator.generate({range: {min: 1, max: 999}, direction: 'inc'})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({range: {min: 1, max: 9}, direction: 'inc'})).toBeNull();
    });

    it('preserves the same step for decrementing', () => {
        const data = generator.generate({range: {min: 1, max: 999}, direction: 'dec'})!.data;
        expect(data.incDecAnswer).toBe(data.numObjects - 10);
    });
});
