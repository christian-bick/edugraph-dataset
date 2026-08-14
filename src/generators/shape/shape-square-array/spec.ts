import {Ability, Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-square-array',
    generalLabels: [Area.Square]
};

export const ShapeSquareArrayGeneratorSchema = {
    modelFeatures: [
        [Area.ShapeComposition, Scope.BoxArrangement, Scope.EqualShares, Scope.TileScale],
        matchAllExactLabels
    ],
    taskAbility: [
        [Ability.Interpretation, Ability.VisualArticulation, Ability.ProcedureExecution],
        selectExactMatch
    ]
} as const;

export type ShapeSquareArrayGeneratorConfig = ConfigFromSchema<
    typeof ShapeSquareArrayGeneratorSchema
>;
