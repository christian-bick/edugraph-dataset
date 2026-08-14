import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassVolumeEstimationGenerator} from './generator.ts';
import {MeasurementMassVolumeEstimationGeneratorSchema, spec} from './spec.ts';

describe('measurement-mass-volume-estimation spec', () => {
    it('declares liquid-volume estimation with a liter reference', () => {
        expect(spec.generalLabels).toEqual([Area.Estimation, Scope.LiquidVolumes, Scope.LiterScale]);
        expect(MeasurementMassVolumeEstimationGeneratorSchema).toEqual({});
    });

    it('supports the Grade 3 liquid-volume estimation target', () => {
        const stub = generateWithLabels(new MeasurementMassVolumeEstimationGenerator(), [
            Area.Estimation,
            Scope.VolumeMeasurement,
            Scope.LiquidVolumes,
            Scope.LiterScale,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.referenceLiters).toBe(1);
    });
});
