import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementAttributeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Scope} from 'edugraph-ts';

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
        const config = {
            attribute: Scope.WeightMeasurement
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
    });
});
