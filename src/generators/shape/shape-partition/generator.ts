import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePartitionProblem} from '../../../types/problems.ts';
import {ShapePartitionGeneratorConfig, ShapePartitionGeneratorSchema} from './spec.ts';

export class ShapePartitionGenerator implements ProblemGenerator<ShapePartitionProblem, ShapePartitionGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePartitionGeneratorSchema;

    generate(config: ShapePartitionGeneratorConfig): ProblemStub | null {
        validateConfigFields('shape-partition', config, ['shape']);
        if (config.shape !== Area.Circle && config.shape !== Area.Rectangle) return null;

        return {
            data: {
                shape: config.shape === Area.Circle ? 'circle' : 'rectangle',
                parts: random() < 0.5 ? 2 : 4
            }
        };
    }
}
