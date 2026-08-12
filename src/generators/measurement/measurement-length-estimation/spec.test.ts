import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementLengthEstimationGenerator} from './generator.ts';
describe('measurement-length-estimation spec', () => {
    it('consumes a metric scale', () => expect(generateWithLabels(new MeasurementLengthEstimationGenerator(), [Area.Estimation, Scope.LengthMeasurement, Scope.CentimeterScale, Ability.ProcedureExecution])?.tags).toContain(Scope.CentimeterScale));
});
