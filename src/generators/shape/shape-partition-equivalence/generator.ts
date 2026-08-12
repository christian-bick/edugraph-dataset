import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapePartitionEquivalenceProblem} from '../../../types/problems.ts';
import {
    ShapePartitionEquivalenceGeneratorConfig,
    ShapePartitionEquivalenceGeneratorSchema
} from './spec.ts';

export class ShapePartitionEquivalenceGenerator implements ProblemGenerator<
    ShapePartitionEquivalenceProblem,
    ShapePartitionEquivalenceGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapePartitionEquivalenceGeneratorSchema;

    generate(
        config: ShapePartitionEquivalenceGeneratorConfig
    ): ProblemStub<ShapePartitionEquivalenceProblem> | null {
        validateConfigFields('shape-partition-equivalence', config, ['shape']);

        const shape = config.shape === Area.Circle
            ? 'circle'
            : config.shape === Area.Rectangle
                ? 'rectangle'
                : null;
        if (!shape) return null;

        return {
            data: {
                shape,
                parts: 2,
                firstPartition: 'straight',
                secondPartition: shape === 'circle' ? 'curved' : 'diagonal',
                conclusion: 'equal shares can have different shapes'
            }
        };
    }
}
