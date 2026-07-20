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

    it('should validate weight attribute type mode', () => {
        const config = {
            attribute: Scope.WeightMeasurement
        };
        const stub = generator.generate(config);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
    });

    it('should validate length attribute type mode', () => {
        const config = {
            attribute: Scope.LengthMeasurement
        };
        let hasLength = false;
        let hasHeight = false;
        
        for (let i = 0; i < 20; i++) {
            const stub = generator.generate(config);
            expect(stub).not.toBeNull();
            expect(['length', 'height']).toContain(stub!.data.attribute);
            if (stub!.data.attribute === 'length') hasLength = true;
            if (stub!.data.attribute === 'height') hasHeight = true;
        }

        expect(hasLength).toBe(true);
        expect(hasHeight).toBe(true);
    });

    it('should throw an error if attribute configuration is missing', () => {
        expect(() => generator.generate({} as any)).toThrow();
    });
});
