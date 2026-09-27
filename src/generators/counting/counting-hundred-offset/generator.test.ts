import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';

describe('CountingHundredOffsetGenerator', () => {
    const generator = new CountingHundredOffsetGenerator();

    it('generates complete, consistent counting-hundred-offset evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 1, max: 999}, direction: 'inc', operandProfile: 'unrestricted'})!.data;
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
        const first = generator.generate({range: {min: 1, max: 999}, direction: 'inc', operandProfile: 'unrestricted'});
        setSeed('counting-hundred-offset');
        expect(generator.generate({range: {min: 1, max: 999}, direction: 'inc', operandProfile: 'unrestricted'})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: {min: 1, max: 1000}, direction: 'inc'})).toThrow('operandProfile');
        expect(generator.generate({range: {min: 1, max: 99}, direction: 'inc', operandProfile: 'unrestricted'})).toBeNull();
    });

    it('preserves the same step for decrementing', () => {
        const data = generator.generate({range: {min: 1, max: 999}, direction: 'dec', operandProfile: 'unrestricted'})!.data;
        expect(data.incDecAnswer).toBe(data.numObjects - 100);
    });

    it.each(['inc', 'dec'] as const)('enforces the three-digit profile and bounds the adjustment for %s', direction => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 100, max: 1000}, direction, operandProfile: 'three-digit'})!.data;
            expect(data.numObjects).toBeGreaterThanOrEqual(data.stepSize);
            expect(String(data.numObjects)).toHaveLength(3);
            for (const value of [data.numObjects, data.stepSize, data.incDecAnswer]) {
                expect(value).toBeGreaterThanOrEqual(100);
                expect(value).toBeLessThanOrEqual(1000);
            }
        }
        expect(generator.generate({range: {min: 120, max: 1000}, direction, operandProfile: 'three-digit'})).toBeNull();
    });
});
