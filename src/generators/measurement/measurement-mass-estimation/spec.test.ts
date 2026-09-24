import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassEstimationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('measurement-mass-estimation spec', () => {
    it('declares the invariant measurement family', () => {
        expect(spec.generalLabels).toEqual([Area.Estimation, Area.MeasuringWeight]);
    });

    it('cannot fall back to another payload family when the target omits its area', () => {
        for (let seed = 0; seed < 30; seed++) {
            const stub = generateWithLabels(new MeasurementMassEstimationGenerator(), []);
            expect(stub!.data.measurementKind).toBe('mass');
        }
    });

    it.each([Scope.GramScale, Scope.KilogramScale])('resolves mass scale %s', scale => {
        const stub = generateWithLabels(new MeasurementMassEstimationGenerator(), [scale]);
        expect(stub!.data.unit).toBe(scale === Scope.GramScale ? 'g' : 'kg');
        expect(stub!.labels).toContain(scale);
    });

});
