import {Ability, Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-square-array',
    generalLabels: []
};

export const ShapeSquareArrayGeneratorSchema = {
    modelFeatures: [
        [
            Area.AreaCalculation,
            Area.Iteration,
            Area.Multiplication,
            Area.Square,
            Area.ShapeDecomposition,
            Scope.BoxArrangement,
            Scope.EqualShares,
            Scope.IntegerNumbers,
            Scope.SquareCentimeterScale,
            Scope.SquareFootScale,
            Scope.SquareInchScale,
            Scope.SquareMeterScale,
            Scope.TileScale,
            Scope.TwoOperands
        ],
        matchAllExactLabels
    ],
    taskAbility: [
        [
            Ability.Interpretation,
            Ability.VisualArticulation,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding
        ],
        selectExactMatch
    ]
} as const;

export type ShapeSquareArrayGeneratorConfig = ConfigFromSchema<
    typeof ShapeSquareArrayGeneratorSchema
>;
