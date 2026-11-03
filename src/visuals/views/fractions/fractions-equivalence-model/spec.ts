import {Ability, Area, Scope} from 'edugraph-ts';
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
    ],
    compatibility: [{
        id: 'equivalence-classification-evidence',
        dependencies: [Area.Multiplication, Area.ProportionalScaling].map(label => ({scope: 'generator' as const, label})),
        predicate: labels => !labels.has('generator', Area.Multiplication) && !labels.has('generator', Area.ProportionalScaling)
    }]
};

export const FractionsEquivalenceModelViewSchema = {} as const;

export type FractionsEquivalenceModelViewConfig = ConfigFromSchema<
    typeof FractionsEquivalenceModelViewSchema
>;
