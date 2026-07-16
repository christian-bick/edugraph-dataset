import { describe, it, expect, beforeEach } from 'vitest';
import { MeasurementAttributeGenerator } from './generator.ts';
import { setSeed } from '../../lib/random.ts';

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
            constraints: { mode: 'attribute-type', attribute: 'weight' }
        };
        const stub = generator.generate(input);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
    });

    it('should return null for non-attribute-type modes', () => {
        const stub = generator.generate({
            labels: [],
            constraints: { mode: 'standard' }
        });
        expect(stub).toBeNull();
    });
});
