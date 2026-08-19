import {Area, Scope} from 'edugraph-ts';
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
        validateConfigFields('shape-square-array', config, ['modelFeatures']);

        const hasFeatures = (...labels: string[]) => labels
            .every(label => config.modelFeatures?.includes(label));

        if (hasFeatures(
            Area.AreaCalculation,
            Area.Equation,
            Area.Multiplication,
            Area.Rectangle,
            Scope.IntegerNumbers,
            Scope.TwoOperands
        )) {
            const [width, length] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            const area = length * width;
            return {
                data: {
                    model: 'rectangle-area-formula',
                    rows: width,
                    columns: length,
                    squareCount: area,
                    length,
                    width,
                    area,
                    areaUnit: 'square units',
                    formula: 'A = length × width'
                }
            };
        }

        if (hasFeatures(
            Area.AreaCalculation,
            Area.Iteration,
            Area.Square,
            Scope.IntegerNumbers,
            Scope.TileScale
        )) {
            const [rows, columns] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            const namedUnit = config.modelFeatures
                ?.map(label => AREA_UNITS.get(label))
                .find(unit => unit !== undefined);
            return {
                data: {
                    model: 'unit-square-coverage',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: namedUnit ?? 'square units'
                }
            };
        }

        if (hasFeatures(
            Area.AreaCalculation,
            Area.Multiplication,
            Area.Square,
            Scope.BoxArrangement,
            Scope.TwoOperands
        )) {
            const [rows, columns] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            return {
                data: {
                    model: 'tiled-area-product',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: 'square units'
                }
            };
        }

        if (hasFeatures(Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands)) {
            const [rows, columns] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            return {
                data: {
                    model: 'rectangle-area-product',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: 'square units'
                }
            };
        }

        if (hasFeatures(
            Area.Square,
            Area.ShapeDecomposition,
            Scope.BoxArrangement,
            Scope.EqualShares
        )) {
            const [rows, columns] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            return {
                data: {
                    model: 'equal-square-array',
                    rows,
                    columns,
                    squareCount: rows * columns,
                    areaUnit: 'square units'
                }
            };
        }

        if (hasFeatures(Area.Square, Scope.TileScale)) {
            return {
                data: {
                    model: 'unit-square',
                    rows: 1,
                    columns: 1,
                    squareCount: 1,
                    areaUnit: 'square units'
                }
            };
        }

        return null;
    }
}
