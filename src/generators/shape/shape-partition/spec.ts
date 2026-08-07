import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition',
    generalLabels: [
        Scope.EqualShares
    ]
};

export const ShapePartitionGeneratorSchema = {
    shape: [Area.Circle, Area.Rectangle],
    taskAbility: [
        [
            Ability.VisualArticulation,
            Ability.ActiveVocabulary,
            Ability.ConceptComposition,
            Ability.ConceptDerivation
        ],
        selectExactMatch
    ],
    unitFractions: [
        [Scope.UnitFractions],
        hasLabel(Scope.UnitFractions)
    ],
    isLessComparison: [
        [Scope.Less],
        hasLabel(Scope.Less)
    ]
} as const;

export type ShapePartitionGeneratorConfig = ConfigFromSchema<typeof ShapePartitionGeneratorSchema>;
