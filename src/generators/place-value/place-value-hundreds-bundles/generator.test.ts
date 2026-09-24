import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueHundredsBundlesGenerator} from './generator.ts';

describe('PlaceValueHundredsBundlesGenerator', () => {
    const generator = new PlaceValueHundredsBundlesGenerator();

    it('generates complete, consistent place-value-hundreds-bundles evidence', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({range: {min: 1, max: 1000}})!.data;
            expect(data.ones).toBe(0);
            expect(data.hundreds).toBeGreaterThanOrEqual(1);
            expect(data.hundreds).toBeLessThanOrEqual(9);
            expect(data.target).toBe(data.hundreds * 100);
            expect(data.tens).toBe(0);
        }
    });

    it('is deterministic for a seed and configuration', () => {
        setSeed('place-value-hundreds-bundles');
        const first = generator.generate({range: {min: 1, max: 1000}});
        setSeed('place-value-hundreds-bundles');
        expect(generator.generate({range: {min: 1, max: 1000}})).toEqual(first);
    });

    it('validates configuration before generating evidence', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({range: {min: 200, max: 100}})).toThrow();
        expect(generator.generate({range: {min: 1, max: 99}})).toBeNull();
    });

    it('supplies the ten-tens witness for the first hundred', () => {
        expect(generator.generate({range: {min: 1, max: 120}})!.data).toEqual({hundreds: 1, tens: 10, ones: 0, target: 100});
    });
});
