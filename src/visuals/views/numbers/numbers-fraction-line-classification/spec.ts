import {Ability, Scope} from 'edugraph-ts';
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
    ]
};

export const NumbersFractionLineClassificationViewSchema = {} as const;
export type NumbersFractionLineClassificationViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineClassificationViewSchema
>;
