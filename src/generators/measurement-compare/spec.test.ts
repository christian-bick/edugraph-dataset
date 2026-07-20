import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementCompareGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('MeasurementCompareGenerator Spec Integration', () => {
    let generator: MeasurementCompareGenerator;

    beforeEach(() => {
        generator = new MeasurementCompareGenerator();
        setSeed(42);
    });

    it('should generate correct length/longer comparison problems', () => {
        const stub = generateWithLabels(generator, [
            Area.Measurement,
            Scope.LengthMeasurement,
            Scope.Greater
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('length');
        expect(stub!.data.relation).toBe('longer');
        expect(stub!.data.val1).toBeLessThanOrEqual(10);
        expect(stub!.data.val2).toBeLessThanOrEqual(10);
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });

    it('should generate correct weight/lighter comparison problems', () => {
        const stub = generateWithLabels(generator, [
            Area.Measurement,
            Scope.WeightMeasurement,
            Scope.Less
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
        expect(stub!.data.relation).toBe('lighter');
        expect(stub!.data.val1).toBeLessThanOrEqual(10);
        expect(stub!.data.val2).toBeLessThanOrEqual(10);
        expect(stub!.data.val1).not.toBe(stub!.data.val2);
    });
});
