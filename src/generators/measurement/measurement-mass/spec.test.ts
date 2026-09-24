import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementMassGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('measurement-mass spec', () => {
    it('declares the invariant measurement family', () => {
        expect(spec.generalLabels).toEqual([Area.MeasuringWeight]);
    });

    it('cannot fall back to another payload family when the target omits its area', () => {
        for (let seed = 0; seed < 30; seed++) {
            const stub = generateWithLabels(new MeasurementMassGenerator(), []);
            expect(stub!.data.measurementKind).toBe('mass');
        }
    });

    it.each([Scope.GramScale, Scope.KilogramScale])('resolves mass scale %s', scale => {
        const stub = generateWithLabels(new MeasurementMassGenerator(), [scale]);
        expect(stub!.data.unit).toBe(scale === Scope.GramScale ? 'g' : 'kg');
        expect(stub!.labels).toContain(scale);
    });

});
