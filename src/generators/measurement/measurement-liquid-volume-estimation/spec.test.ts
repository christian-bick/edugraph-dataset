import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementLiquidVolumeEstimationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('measurement-liquid-volume-estimation spec', () => {
    it('declares the invariant measurement family', () => {
        expect(spec.generalLabels).toEqual([Area.Estimation, Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale]);
    });

    it('cannot fall back to another payload family when the target omits its area', () => {
        for (let seed = 0; seed < 30; seed++) {
            const stub = generateWithLabels(new MeasurementLiquidVolumeEstimationGenerator(), []);
            expect(stub!.data.measurementKind).toBe('liquid-volume');
        }
    });

});
