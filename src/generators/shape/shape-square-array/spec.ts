import {Ability, Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-square-array',
    generalLabels: [
        Area.Square,
        Area.ShapeComposition,
        Scope.BoxArrangement,
        Scope.EqualShares
    ]
};

export const ShapeSquareArrayGeneratorSchema = {
    taskAbility: [
        [Ability.VisualArticulation, Ability.ProcedureExecution],
        selectExactMatch
    ]
} as const;

export type ShapeSquareArrayGeneratorConfig = ConfigFromSchema<
    typeof ShapeSquareArrayGeneratorSchema
>;
