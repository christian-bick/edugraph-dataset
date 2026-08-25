import {beforeEach, describe, expect, it} from 'vitest';
import {MeasurementCompareGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementCompareGeneratorSchema, spec} from './spec.ts';

describe('MeasurementCompareGenerator Spec Integration', () => {
    let generator: MeasurementCompareGenerator;

    beforeEach(() => {
        generator = new MeasurementCompareGenerator();
        setSeed(42);
    });

    it('resolves the measured attribute as the mathematical Area', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(MeasurementCompareGeneratorSchema.attribute).toEqual([
            Area.MeasuringLength,
            Area.MeasuringWeight
        ]);
        expect(spec.generalLabels).not.toContain(Area.ObjectSorting);
    });

    it('should generate correct length/longer comparison problems', () => {
        const stub = generateWithLabels(generator, [
            Area.MeasuringLength,
            Scope.Greater
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('length');
        expect(stub!.data.relation).toBe('greater');
        expect(stub!.data.magnitudes.larger).toBeLessThanOrEqual(10);
        expect(stub!.data.magnitudes.smaller).toBeLessThan(stub!.data.magnitudes.larger);
    });

    it('should generate correct weight/lighter comparison problems', () => {
        const stub = generateWithLabels(generator, [
            Area.MeasuringWeight,
            Scope.Less
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.attribute).toBe('weight');
        expect(stub!.data.relation).toBe('less');
        expect(stub!.data.magnitudes.larger).toBeLessThanOrEqual(10);
        expect(stub!.data.magnitudes.smaller).toBeLessThan(stub!.data.magnitudes.larger);
    });
});
