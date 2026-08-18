import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition',
    generalLabels: [
        Area.ProportionSense,
        Scope.EqualShares
    ]
};

export const ShapePartitionGeneratorSchema = {
    shape: [Area.Circle, Area.Rectangle],
    taskAbilities: [
        [
            Ability.VisualArticulation,
            Ability.ActiveVocabulary,
            Ability.ConceptComposition,
            Ability.ConceptDerivation,
            Ability.Formalization,
            Ability.Interpretation
        ],
        matchAllExactLabels
    ],
    fractionTypes: [
        [Scope.UnitFractions, Scope.NonUnitFractions],
        matchAllExactLabels
    ],
    fractionNotation: [
        [Area.FractionNotation],
        hasLabel(Area.FractionNotation)
    ],
    isLessComparison: [
        [Scope.Less],
        hasLabel(Scope.Less)
    ]
} as const;

export type ShapePartitionGeneratorConfig = ConfigFromSchema<typeof ShapePartitionGeneratorSchema>;
