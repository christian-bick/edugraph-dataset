import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {GenericUnitCountRelationProblem} from '../../../types/problems.ts';
import {buildGenericUnitCountRelation, selectUnitScaleFrame, unitScaleDomain} from '../unit-scale-domain.ts';
import {MeasurementUnitCountRelationsGeneratorSchema} from './spec.ts';
import type {MeasurementUnitCountRelationsGeneratorConfig} from './spec.ts';

export class MeasurementUnitCountRelationsGenerator implements ProblemGenerator<GenericUnitCountRelationProblem, MeasurementUnitCountRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementUnitCountRelationsGeneratorSchema;

    generate(config: MeasurementUnitCountRelationsGeneratorConfig): ProblemStub<GenericUnitCountRelationProblem> {
        validateConfigFields('measurement-unit-count-relations', config, ['range']);
        return {data: buildGenericUnitCountRelation(selectUnitScaleFrame(unitScaleDomain('counts', config.range!), random))};
    }
}
