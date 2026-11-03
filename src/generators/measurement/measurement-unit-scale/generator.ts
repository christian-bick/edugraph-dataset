import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {GenericUnitScaleRelationProblem} from '../../../types/problems.ts';
import {MeasurementUnitScaleGeneratorConfig, MeasurementUnitScaleGeneratorSchema} from './spec.ts';
import {selectUnitScaleFrame, unitScaleDomain} from '../unit-scale-domain.ts';

export class MeasurementUnitScaleGenerator implements ProblemGenerator<GenericUnitScaleRelationProblem, MeasurementUnitScaleGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitScaleGeneratorSchema;

    generate(config: MeasurementUnitScaleGeneratorConfig): ProblemStub<GenericUnitScaleRelationProblem> {
        validateConfigFields('measurement-unit-scale', config, ['range']);
        return {data: {...selectUnitScaleFrame(unitScaleDomain('factor', config.range!), random)}};
    }
}
