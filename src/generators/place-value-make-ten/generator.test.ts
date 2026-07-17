import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueMakeTenGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

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
        const stub = generator.generate({ includeZero: false });
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(9);
        expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        expect(stub!.data.target).toBe(10);
    });

    it('should generate correct make-ten missing addends with zero included', () => {
        const stub = generator.generate({ includeZero: true });
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(0);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(10);
        expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        expect(stub!.data.target).toBe(10);
    });
});
