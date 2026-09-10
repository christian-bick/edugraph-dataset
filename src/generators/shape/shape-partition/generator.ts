import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePartitionProblem} from '../../../types/problems.ts';
import {ShapePartitionGeneratorConfig, ShapePartitionGeneratorSchema} from './spec.ts';

export class ShapePartitionGenerator implements ProblemGenerator<ShapePartitionProblem, ShapePartitionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePartitionGeneratorSchema;

    generate(config: ShapePartitionGeneratorConfig): ProblemStub<ShapePartitionProblem> {
        validateConfigFields('shape-partition', config, ['shape', 'parts']);
        const {shape, parts} = config;
        if ((shape !== 'circle' && shape !== 'rectangle') || ![2, 3, 4, 6, 8].includes(parts!)) {
            throw new GeneratorValidationError('shape-partition', 'Expected a circle or rectangle with a supported equal partition.');
        }
        return {data: {kind: 'partition', shape, parts: parts!}};
    }
}
