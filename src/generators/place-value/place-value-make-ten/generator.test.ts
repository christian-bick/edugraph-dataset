import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueMakeTenGenerator} from './generator.ts';

describe('PlaceValueMakeTenGenerator', () => {
    const generator = new PlaceValueMakeTenGenerator();

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should produce a visible zero witness for every zero-required sample', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({requireZero: true, range: {min: 0, max: 10}});
            expect(stub).not.toBeNull();
            const {givenNumber, missingNumber, target} = stub!.data;
            expect(givenNumber + missingNumber).toBe(target);
            expect([givenNumber, missingNumber]).toContain(0);
        }
    });

    it('should exclude zero for every nonzero sample', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generator.generate({requireZero: false, range: {min: 0, max: 10}});
            expect(stub).not.toBeNull();
            const {givenNumber, missingNumber, target} = stub!.data;
            expect(givenNumber + missingNumber).toBe(target);
            expect(givenNumber).toBeGreaterThanOrEqual(1);
            expect(givenNumber).toBeLessThanOrEqual(9);
            expect(missingNumber).toBeGreaterThanOrEqual(1);
        }
    });

    it('should clamp the given number to the requested range', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generator.generate({requireZero: false, range: {min: 3, max: 7}});
            expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(3);
            expect(stub!.data.givenNumber).toBeLessThanOrEqual(7);
        }
    });

    it('should strictly validate config and reject incompatible ranges', () => {
        expect(() => generator.generate(undefined as any)).toThrow();
        expect(() => generator.generate({} as any)).toThrow();
        expect(() => generator.generate({requireZero: false} as any)).toThrow();
        expect(() => generator.generate({requireZero: false, range: {min: 11, max: 20}})).toThrow();
        expect(() => generator.generate({requireZero: true, range: {min: 1, max: 9}})).toThrow();
    });
});
