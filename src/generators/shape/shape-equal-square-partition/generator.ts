import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EqualSquarePartitionProblem} from '../../../types/problems.ts';
import {selectArrayDimensions} from '../shape-square-array-helpers.ts';
import {
    ShapeEqualSquarePartitionGeneratorConfig,
    ShapeEqualSquarePartitionGeneratorSchema
} from './spec.ts';

export class ShapeEqualSquarePartitionGenerator implements ProblemGenerator<
    EqualSquarePartitionProblem,
    ShapeEqualSquarePartitionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeEqualSquarePartitionGeneratorSchema;

    generate(
        _config: ShapeEqualSquarePartitionGeneratorConfig
    ): ProblemStub<EqualSquarePartitionProblem> {
        const [rows, columns] = selectArrayDimensions(random());
        return {
            data: {
                kind: 'equal-square-partition',
                rows,
                columns,
                partCount: rows * columns
            }
        };
    }
}
