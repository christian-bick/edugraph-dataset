import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';

describe('CountingHundredOffsetGenerator', () => {
    const generator = new CountingHundredOffsetGenerator();

    it('generates complete, consistent counting-hundred-offset evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 1, max: 999}, direction: 'inc'})!.data;
            expect(data.stepSize).toBe(100);
            expect(data.incDecAnswer).toBe(data.numObjects + 100);
            const start = data.startPlaceValue;
            const result = data.resultPlaceValue;
            expect(data.numObjects).toBe((start.hundreds ?? 0) * 100 + start.tens * 10 + start.ones);
            expect(data.incDecAnswer).toBe((result.hundreds ?? 0) * 100 + result.tens * 10 + result.ones);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('counting-hundred-offset');
        const first = generator.generate({range: {min: 1, max: 999}, direction: 'inc'});
        setSeed('counting-hundred-offset');
        expect(generator.generate({range: {min: 1, max: 999}, direction: 'inc'})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(generator.generate({range: {min: 1, max: 99}, direction: 'inc'})).toBeNull();
    });

    it('preserves the same step for decrementing', () => {
        const data = generator.generate({range: {min: 1, max: 999}, direction: 'dec'})!.data;
        expect(data.incDecAnswer).toBe(data.numObjects - 100);
    });
});
