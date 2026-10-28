import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-comparison',
    generalLabels: [
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ConceptDerivation
    ]
};

export const NumbersDecimalComparisonViewSchema = {} as const;

export type NumbersDecimalComparisonViewConfig = ConfigFromSchema<
    typeof NumbersDecimalComparisonViewSchema
>;
