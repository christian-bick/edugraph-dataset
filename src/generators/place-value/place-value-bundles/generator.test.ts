import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueBundlesGenerator} from './generator.ts';

describe('PlaceValueBundlesGenerator', () => {
    const generator = new PlaceValueBundlesGenerator();

    it('strictly validates required configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({
            range: {min: 20, max: 10}
        })).toThrow();
    });

    it('generates a whole-ten value inside a small range', () => {
        const stub = generator.generate({
            range: {min: 0, max: 20}
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe(stub!.data.tens * 10);
        expect([10, 20]).toContain(stub!.data.target);
    });

    it('resolves an inclusive upper bound of 10 to exactly one ten', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                range: {min: 0, max: 10}
            });

            expect(stub).not.toBeNull();
            expect(stub!.data).toEqual({
                tens: 1,
                ones: 0,
                target: 10
            });
        }
    });

    it('generates 10 through 90 as whole tens for every seed', () => {
        const targets = new Set<number>();

        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                range: {min: 0, max: 100}
            });
            expect(stub).not.toBeNull();
            expect(stub!.data.tens).toBeGreaterThanOrEqual(1);
            expect(stub!.data.tens).toBeLessThanOrEqual(9);
            expect(stub!.data.ones).toBe(0);
            expect(stub!.data.target).toBe(stub!.data.tens * 10);
            targets.add(stub!.data.target);
        }

        expect(targets.size).toBeGreaterThan(1);
    });

    it('returns null when the resolved range contains no positive multiple of ten', () => {
        expect(generator.generate({
            range: {min: 0, max: 9}
        })).toBeNull();
    });
});
