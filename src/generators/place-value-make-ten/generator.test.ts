import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueMakeTenGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';

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
        const input: GeneratorInput = {
            labels: [Area.PlaceValue, Scope.NumbersSmaller20]
        };

        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
        expect(stub!.data.givenNumber).toBeLessThanOrEqual(9);
        expect(stub!.data.missingNumber + stub!.data.givenNumber).toBe(10);
        expect(stub!.data.target).toBe(10);
    });
});
