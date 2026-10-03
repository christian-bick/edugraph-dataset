import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-place-comparison',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};

export const NumbersDecimalPlaceComparisonViewSchema = {} as const;
export type NumbersDecimalPlaceComparisonViewConfig = ConfigFromSchema<
    typeof NumbersDecimalPlaceComparisonViewSchema
>;
