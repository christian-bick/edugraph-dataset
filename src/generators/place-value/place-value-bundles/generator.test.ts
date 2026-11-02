import {PlaceValueHundredsBundlesGenerator} from '../place-value-hundreds-bundles/generator.ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueBundlesGenerator} from './generator.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {tensRangeProfiles} from './numeric-domain.ts';

describe('PlaceValueBundlesGenerator', () => {
    const generator = new PlaceValueBundlesGenerator();

    it('strictly validates required configuration', () => {
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({
            range: {...createCanonicalNumericRange(10), min: 20}
        })).toThrow();
    });

    it('generates a whole-ten value inside a small range', () => {
        const stub = generator.generate({
            range: createCanonicalNumericRange(20)
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.target).toBe(stub!.data.tens * 10);
        expect(stub!.data.target).toBe(20);
    });

    it('resolves an inclusive upper bound of 10 to exactly one ten', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                range: createCanonicalNumericRange(10)
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
                range: tensRangeProfiles[seed % tensRangeProfiles.length]!.range
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

    it('rejects a canonical band containing no required complete ten', () => {
        expect(() => generator.generate({range: createCanonicalNumericRange(5)})).toThrow();
    });

    it('represents an explicit ten-tens exchange as one hundred', () => {
        const data = new PlaceValueHundredsBundlesGenerator().generate({
            range: createCanonicalNumericRange(100), requireRegrouping: true
        })!.data;
        expect(data).toEqual({hundreds: 1, tens: 10, ones: 0, target: 100});
    });

    it('generates one through nine complete hundreds', () => {
        for (const range of [createCanonicalNumericRange(100), createCanonicalNumericRange(1000),
            createCanonicalNumericRange(1000, 5)]) for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = new PlaceValueHundredsBundlesGenerator().generate({
                range, requireRegrouping: false
            })!.data;
            expect(data.hundreds).toBeGreaterThanOrEqual(1);
            expect(data.hundreds).toBeLessThanOrEqual(9);
            expect(data.tens).toBe(0);
            expect(data.target).toBe(data.hundreds! * 100);
        }
    });
});
