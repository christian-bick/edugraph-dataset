import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassVolumeGenerator} from './generator.ts';
import {MeasurementMassVolumeGeneratorSchema, spec} from './spec.ts';

describe('MeasurementMassVolumeGenerator spec integration', () => {
    it('supports calibrated liter measurements', () => {
        const stub = generateWithLabels(new MeasurementMassVolumeGenerator(), [
            Area.MeasuringObjects,
            Scope.VolumeMeasurement,
            Scope.LiquidVolumes,
            Scope.LiterScale,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.unit).toBe('L');
    });

    it('declares object measurement with an explicit metric scale', () => {
        expect(spec.generalLabels).toEqual([Area.MeasuringObjects]);
        expect(MeasurementMassVolumeGeneratorSchema.measurement).toEqual([
            Scope.LiquidVolumes,
            Scope.WeightMeasurement
        ]);
        expect(MeasurementMassVolumeGeneratorSchema.scale).toEqual([
            Scope.LiterScale,
            Scope.GramScale,
            Scope.KilogramScale
        ]);
    });

    it.each([Scope.GramScale, Scope.KilogramScale])('supports mass measurement with %s', scale => {
        const stub = generateWithLabels(new MeasurementMassVolumeGenerator(), [
            Area.MeasuringObjects,
            Scope.WeightMeasurement,
            scale,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.tags).toContain(scale);
        expect(stub!.data.measurementKind).toBe('mass');
    });
});
