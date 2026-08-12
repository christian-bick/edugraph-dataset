import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementUnitScaleProblem} from '../../../types/problems.ts';
import {MeasurementUnitScaleGeneratorConfig, MeasurementUnitScaleGeneratorSchema} from './spec.ts';

export class MeasurementUnitScaleGenerator implements ProblemGenerator<MeasurementUnitScaleProblem, MeasurementUnitScaleGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitScaleGeneratorSchema;

    generate(_config: MeasurementUnitScaleGeneratorConfig): ProblemStub<MeasurementUnitScaleProblem> {
        const largeUnitCount = 3 + Math.floor(random() * 4);
        const unitsPerLarge = 2 + Math.floor(random() * 2);
        return {data: {largeUnitCount, unitsPerLarge, smallUnitCount: largeUnitCount * unitsPerLarge}};
    }
}
