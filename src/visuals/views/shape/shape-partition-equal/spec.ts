import {Ability} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-equal',
    generalLabels: []
};

export const ShapePartitionEqualViewSchema = {
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
    ]
} as const;

export type ShapePartitionEqualViewConfig = ConfigFromSchema<typeof ShapePartitionEqualViewSchema>;
