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

        if (config.taskAbility === Ability.ProcedureExecution) {
            const appliesRectangleFormula = [
                Area.AreaCalculation,
                Area.Equation,
                Area.Multiplication,
                Area.Rectangle,
                Scope.IntegerNumbers,
                Scope.TwoOperands
            ].every(label => config.modelFeatures?.includes(label));
            if (appliesRectangleFormula) {
                const [width, length] = ARRAY_DIMENSIONS[
                    Math.floor(random() * ARRAY_DIMENSIONS.length)
                ];
                const area = length * width;
                return {
                    data: {
                        task: 'rectangle-area-formula',
                        rows: width,
                        columns: length,
                        squareCount: area,
                        length,
                        width,
                        area,
                        areaUnit: 'square units',
                        formula: 'A = length × width',
                        prompt: `Find the area of a rectangle with length ${length} units and width ${width} units.`,
                        questionEquation: `A = ${length} × ${width} = ?`,
                        solutionEquation: `A = ${length} × ${width} = ${area}`,
                        answerStatement: `The area is ${area} square units.`,
                        explanation: `The area formula is A = length × width. Multiply ${length} units by ${width} units to get ${area} square units.`
                    }
                };
            }
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

        if (config.taskAbility === Ability.ProcedureInversion) {
            const findsMissingDimension = [
                Area.AreaCalculation,
                Area.Equation,
                Area.Multiplication,
                Area.Rectangle,
                Scope.IntegerNumbers,
                Scope.TwoOperands
            ].every(label => config.modelFeatures?.includes(label));
            if (!findsMissingDimension) return null;
            const [width, length] = ARRAY_DIMENSIONS[
                Math.floor(random() * ARRAY_DIMENSIONS.length)
            ];
            const area = length * width;
            const unknownDimension = random() < 0.5 ? 'length' : 'width';
            const knownDimension = unknownDimension === 'length' ? 'width' : 'length';
            const knownValue = knownDimension === 'length' ? length : width;
            const missingValue = unknownDimension === 'length' ? length : width;
            const questionEquation = unknownDimension === 'length'
                ? `${area} = ? × ${width}`
                : `${area} = ${length} × ?`;
            return {
                data: {
                    task: 'find-missing-area-dimension',
                    rows: width,
                    columns: length,
                    squareCount: area,
                    length,
                    width,
                    area,
                    areaUnit: 'square units',
                    formula: 'A = length × width',
                    unknownDimension,
                    knownDimension,
                    knownValue,
                    missingValue,
                    prompt: `A rectangle has an area of ${area} square units and a ${knownDimension} of ${knownValue} units. Find its ${unknownDimension}.`,
                    questionEquation,
                    inverseEquation: `${area} ÷ ${knownValue} = ?`,
                    solutionEquation: `${area} ÷ ${knownValue} = ${missingValue}`,
                    answerStatement: `The ${unknownDimension} is ${missingValue} units.`,
                    explanation: `Because area equals length times width, divide ${area} by the known ${knownDimension}, ${knownValue}, to get the missing ${unknownDimension}, ${missingValue} units.`
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

        const hasArrayModel = [Area.Square, Area.ShapeDecomposition, Scope.BoxArrangement, Scope.EqualShares]
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
