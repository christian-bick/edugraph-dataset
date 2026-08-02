import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueBundlesGenerator} from './generator.ts';

describe('PlaceValueBundlesGenerator', () => {
    const generator = new PlaceValueBundlesGenerator();

    it('strictly validates required configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({useMultipleTens: false} as any)).toThrow();
        expect(() => generator.generate({
            useMultipleTens: false,
            range: {min: 20, max: 10}
        })).toThrow();
    });

    it('represents one ten as ten ones when multiples are not requested', () => {
        const stub = generator.generate({
            useMultipleTens: false,
            range: {min: 0, max: 20}
        });
        expect(stub?.data).toEqual({tens: 1, ones: 0, target: 10});
    });

    it('generates 10 through 90 as whole tens for every seed', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                useMultipleTens: true,
                range: {min: 0, max: 100}
            });
            expect(stub).not.toBeNull();
            expect(stub!.data.tens).toBeGreaterThanOrEqual(1);
            expect(stub!.data.tens).toBeLessThanOrEqual(9);
            expect(stub!.data.ones).toBe(0);
            expect(stub!.data.target).toBe(stub!.data.tens * 10);
        }
    });

    it('returns null when the resolved range contains no positive multiple of ten', () => {
        expect(generator.generate({
            useMultipleTens: true,
            range: {min: 0, max: 9}
        })).toBeNull();
    });
});
