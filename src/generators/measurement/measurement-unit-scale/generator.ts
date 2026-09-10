import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {GenericUnitScaleRelationProblem} from '../../../types/problems.ts';
import {MeasurementUnitScaleGeneratorConfig, MeasurementUnitScaleGeneratorSchema} from './spec.ts';

export class MeasurementUnitScaleGenerator implements ProblemGenerator<GenericUnitScaleRelationProblem, MeasurementUnitScaleGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitScaleGeneratorSchema;

    generate(config: MeasurementUnitScaleGeneratorConfig): ProblemStub<GenericUnitScaleRelationProblem> {
        validateConfigFields('measurement-unit-scale', config, []);

        const largeUnitCount = 3 + Math.floor(random() * 4);
        const unitsPerLarge = 2 + Math.floor(random() * 2);
        return {data: {
            largeUnitCount,
            smallUnitCount: largeUnitCount * unitsPerLarge,
            unitsPerLarge
        }};
    }
}
