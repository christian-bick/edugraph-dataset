import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-rounding-line',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};

export const NumbersDecimalRoundingLineViewSchema = {} as const;
export type NumbersDecimalRoundingLineViewConfig = ConfigFromSchema<
    typeof NumbersDecimalRoundingLineViewSchema
>;
