import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementAttributeGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('MeasurementAttributeGenerator Spec Integration', () => {
    let generator: MeasurementAttributeGenerator;

    beforeEach(() => {
        generator = new MeasurementAttributeGenerator();
        setSeed(42);
    });

    it('should generate correct length/height attribute problems', () => {
        let hasLength = false;
        let hasHeight = false;

        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.MeasuringObjects,
                Scope.LengthMeasurement
            ]);
            expect(stub).not.toBeNull();
            expect(['length', 'height']).toContain(stub!.data.attribute);
            if (stub!.data.attribute === 'length') hasLength = true;
            if (stub!.data.attribute === 'height') hasHeight = true;
        }

        expect(hasLength).toBe(true);
        expect(hasHeight).toBe(true);
    });

    it('should generate correct weight attribute problems', () => {
        const stub = generateWithLabels(generator, [
            Area.MeasuringObjects,
            Scope.WeightMeasurement
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
    });
});
