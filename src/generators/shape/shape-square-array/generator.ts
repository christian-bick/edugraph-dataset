import {Ability, Area, Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ShapeSquareArrayProblem} from '../../../types/problems.ts';
import {
    ShapeSquareArrayGeneratorConfig,
    ShapeSquareArrayGeneratorSchema
} from './spec.ts';

const ARRAY_DIMENSIONS = [
    [2, 3],
    [3, 2],
    [2, 4],
    [4, 2],
    [2, 5],
    [5, 2],
    [3, 4],
    [4, 3],
    [3, 5],
    [5, 3],
    [4, 5],
    [5, 4]
] as const;

export class ShapeSquareArrayGenerator implements ProblemGenerator<
    ShapeSquareArrayProblem,
    ShapeSquareArrayGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeSquareArrayGeneratorSchema;

    generate(
        config: ShapeSquareArrayGeneratorConfig
    ): ProblemStub<ShapeSquareArrayProblem> | null {
        validateConfigFields('shape-square-array', config, ['modelFeatures', 'taskAbility']);

        if (config.taskAbility === Ability.Interpretation) {
            if (!config.modelFeatures?.includes(Scope.TileScale)) return null;
            return {
                data: {
                    task: 'interpret-unit',
                    rows: 1,
                    columns: 1,
                    squareCount: 1
                }
            };
        }

        const hasArrayModel = [Area.ShapeComposition, Scope.BoxArrangement, Scope.EqualShares]
            .every(label => config.modelFeatures?.includes(label));
        if (!hasArrayModel) return null;

        const task = config.taskAbility === Ability.VisualArticulation
            ? 'partition'
            : config.taskAbility === Ability.ProcedureExecution
                ? 'count'
                : null;
        if (!task) return null;

        const [rows, columns] = ARRAY_DIMENSIONS[
            Math.floor(random() * ARRAY_DIMENSIONS.length)
        ];

        return {
            data: {
                task,
                rows,
                columns,
                squareCount: rows * columns
            }
        };
    }
}
