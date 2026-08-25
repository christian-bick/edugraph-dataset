import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassVolumeGenerator} from './generator.ts';
import {MeasurementMassVolumeGeneratorSchema, spec} from './spec.ts';

describe('MeasurementMassVolumeGenerator spec integration', () => {
    it('supports calibrated liter measurements', () => {
        const stub = generateWithLabels(new MeasurementMassVolumeGenerator(), [
            Area.MeasuringVolumes,
            Scope.LiquidVolumes,
            Scope.LiterScale,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.unit).toBe('L');
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.MeasuringVolumes,
            Scope.LiquidVolumes,
            Scope.LiterScale
        ]));
    });

    it('declares object measurement with an explicit metric scale', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(MeasurementMassVolumeGeneratorSchema.measurement[0]).toEqual([
            Area.MeasuringVolumes,
            Scope.LiquidVolumes,
            Scope.LiterScale,
            Area.MeasuringWeight,
            Scope.GramScale,
            Scope.KilogramScale
        ]);
        expect(MeasurementMassVolumeGeneratorSchema.measurement[2]).toEqual([
            [Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale],
            [Area.MeasuringWeight, Scope.GramScale],
            [Area.MeasuringWeight, Scope.KilogramScale]
        ]);
    });

    it.each([Scope.GramScale, Scope.KilogramScale])('supports mass measurement with %s', scale => {
        const stub = generateWithLabels(new MeasurementMassVolumeGenerator(), [
            Area.MeasuringWeight,
            scale,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).toContain(Area.MeasuringWeight);
        expect(stub!.labels).toContain(scale);
        expect(stub!.data.measurementKind).toBe('mass');
    });
});
