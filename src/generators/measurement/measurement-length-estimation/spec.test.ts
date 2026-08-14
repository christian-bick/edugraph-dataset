import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementLengthEstimationGenerator} from './generator.ts';
import {MeasurementLengthEstimationGeneratorSchema, spec} from './spec.ts';

describe('measurement-length-estimation spec', () => {
    it('declares the invariant estimation mathematics with an empty schema', () => {
        expect(spec.generalLabels).toEqual([Area.Estimation, Scope.LengthMeasurement]);
        expect(MeasurementLengthEstimationGeneratorSchema).toEqual({});
    });

    it.each([
        Scope.CentimeterScale,
        Scope.MeterScale,
        Scope.InchScale,
        Scope.FootScale
    ])('leaves %s unconsumed for the view to resolve', scale => {
        setSeed(17);
        const result = generateWithLabels(new MeasurementLengthEstimationGenerator(), [
            Area.Estimation,
            Scope.LengthMeasurement,
            scale,
            Ability.ProcedureExecution
        ]);

        expect(result?.data).toEqual({
            referenceSize: 'large',
            estimateVariant: 0,
            referenceVariant: 2
        });
        expect(result?.tags).toEqual([]);
    });
});
