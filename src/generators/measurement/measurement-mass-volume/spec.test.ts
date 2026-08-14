import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassVolumeGenerator} from './generator.ts';

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
});
