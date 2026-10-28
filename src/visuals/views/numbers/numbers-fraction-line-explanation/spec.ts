import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line-explanation',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.Formalization,
        Ability.ProcedureUnderstanding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithZero
    ]
};

export const NumbersFractionLineExplanationViewSchema = {} as const;
export type NumbersFractionLineExplanationViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineExplanationViewSchema
>;
