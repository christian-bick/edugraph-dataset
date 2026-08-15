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

const AREA_UNITS = new Map<string, ShapeSquareArrayProblem['areaUnit']>([
    [Scope.SquareCentimeterScale, 'square centimeters'],
    [Scope.SquareMeterScale, 'square meters'],
    [Scope.SquareInchScale, 'square inches'],
    [Scope.SquareFootScale, 'square feet']
]);

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
            if (
                !config.modelFeatures?.includes(Area.Square)
                || !config.modelFeatures.includes(Scope.TileScale)
            ) return null;
            const interpretsCoverage = [Area.AreaCalculation, Area.Iteration, Scope.IntegerNumbers]
                .every(label => config.modelFeatures?.includes(label));
            if (interpretsCoverage) {
                const [rows, columns] = ARRAY_DIMENSIONS[
                    Math.floor(random() * ARRAY_DIMENSIONS.length)
                ];
                return {
                    data: {
                        task: 'interpret-coverage',
                        rows,
                        columns,
                        squareCount: rows * columns
                    }
                };
            }
            return {
                data: {
                    task: 'interpret-unit',
                    rows: 1,
                    columns: 1,
                    squareCount: 1
                }
            };
        }

        if (config.taskAbility === Ability.ProcedureUnderstanding) {
            const connectsTilingToProduct = [
                Area.AreaCalculation,
                Area.Multiplication,
                Area.Square,
                Scope.BoxArrangement,
                Scope.TwoOperands
            ].every(label => config.modelFeatures?.includes(label));
            if (!connectsTilingToProduct) return null;
            const [rows, columns] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            return {
                data: {
                    task: 'explain-product',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: 'square units'
                }
            };
        }

        const task = config.taskAbility === Ability.VisualArticulation
            ? 'partition'
            : config.taskAbility === Ability.ProcedureExecution
                ? 'count'
                : null;
        if (!task) return null;

        const [rows, columns] = ARRAY_DIMENSIONS[
            Math.floor(random() * ARRAY_DIMENSIONS.length)
        ];

        const measuresArea = [Area.AreaCalculation, Area.Iteration, Scope.IntegerNumbers, Scope.TileScale]
            .every(label => config.modelFeatures?.includes(label));
        if (task === 'count' && measuresArea && config.modelFeatures?.includes(Area.Square)) {
            const namedUnit = config.modelFeatures
                ?.map(label => AREA_UNITS.get(label))
                .find(unit => unit !== undefined);
            return {
                data: {
                    task: 'count-area',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: namedUnit ?? 'square units'
                }
            };
        }


        const calculatesRectangularArea = [Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands]
            .every(label => config.modelFeatures?.includes(label));
        if (task === 'count' && calculatesRectangularArea) {
            return {
                data: {
                    task: 'calculate-area',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: 'square units'
                }
            };
        }

        const hasArrayModel = [Area.Square, Area.ShapeComposition, Scope.BoxArrangement, Scope.EqualShares]
            .every(label => config.modelFeatures?.includes(label));
        if (!hasArrayModel) return null;

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
