import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementAttributeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';

describe('MeasurementAttributeGenerator', () => {
    let generator: MeasurementAttributeGenerator;

    beforeEach(() => {
        generator = new MeasurementAttributeGenerator();
        setSeed(42);
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('measurement');
    });

    it('should validate attribute-type modes', () => {
        const input = {
            labels: [],
            constraints: { attribute: 'weight' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
    });
});
