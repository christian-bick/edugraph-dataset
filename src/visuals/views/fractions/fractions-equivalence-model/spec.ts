import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-equivalence-model',
    generalLabels: [
        Scope.VisualNumbers,
        Scope.SingleFrameOfReference,
        Ability.ConceptClassification,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero
    ]
};

export const FractionsEquivalenceModelViewSchema = {} as const;

export type FractionsEquivalenceModelViewConfig = ConfigFromSchema<
    typeof FractionsEquivalenceModelViewSchema
>;
