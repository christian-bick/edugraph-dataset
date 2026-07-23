import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueMakeTenGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';

describe('PlaceValueMakeTenGenerator', () => {
    let generator: PlaceValueMakeTenGenerator;

    beforeEach(() => {
        generator = new PlaceValueMakeTenGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('arithmetic');
    });

    it('should generate correct make-ten missing addends', () => {
        const stub = generator.generate({ includeZero: false, range: { min: 0, max: 10 } });
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(9);
        expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        expect(stub!.data.target).toBe(10);
    });

    it('should generate correct make-ten missing addends with zero included', () => {
        const stub = generator.generate({ includeZero: true, range: { min: 0, max: 10 } });
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(0);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(10);
        expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        expect(stub!.data.target).toBe(10);
    });

    it('should clamp the given number to the requested range', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate({ includeZero: false, range: { min: 3, max: 7 } });
            expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(3);
            expect(stub!.data.givenNumber).toBeLessThanOrEqual(7);
            expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        }
    });

    it('should ignore range bounds beyond the make-ten domain', () => {
        const stub = generator.generate({ includeZero: false, range: { min: 0, max: 100 } });
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(9);
    });

    describe('validation', () => {
        it('should throw an error if configuration is missing', () => {
            expect(() => generator.generate(undefined as any)).toThrow();
        });

        it('should throw an error if includeZero is missing', () => {
            expect(() => generator.generate({} as any)).toThrow();
        });

        it('should throw an error if range is missing', () => {
            expect(() => generator.generate({ includeZero: false } as any)).toThrow();
        });

        it('should throw an error when the range cannot make ten', () => {
            expect(() => generator.generate({ includeZero: false, range: { min: 11, max: 20 } })).toThrow();
        });
    });
});
