import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line-classification',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.ConceptClassification,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithZero
    ],
    compatibility: [{
        id: 'equivalence-classification-evidence',
        dependencies: [Area.Multiplication, Area.ProportionalScaling].map(label => ({scope: 'generator' as const, label})),
        predicate: labels => !labels.has('generator', Area.Multiplication) && !labels.has('generator', Area.ProportionalScaling)
    }]
};

export const NumbersFractionLineClassificationViewSchema = {} as const;
export type NumbersFractionLineClassificationViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineClassificationViewSchema
>;
