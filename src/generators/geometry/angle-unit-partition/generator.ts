import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {AngleUnitPartitionProblem} from '../../../types/problems.ts';
import {AngleUnitPartitionGeneratorConfig, AngleUnitPartitionGeneratorSchema} from './spec.ts';

export class AngleUnitPartitionGenerator implements ProblemGenerator<AngleUnitPartitionProblem, AngleUnitPartitionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleUnitPartitionGeneratorSchema;

    generate(config: AngleUnitPartitionGeneratorConfig): ProblemStub<AngleUnitPartitionProblem> {
        validateConfigFields('angle-unit-partition', config, []);
        return {data: {kind: 'equal-angle-partition', fullTurnDegrees: 360, parts: 360, angleDegrees: 1}};
    }
}
