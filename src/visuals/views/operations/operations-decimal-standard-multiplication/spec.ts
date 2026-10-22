import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decimal-standard-multiplication',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};
export const OperationsDecimalStandardMultiplicationViewSchema = {} as const;
export type OperationsDecimalStandardMultiplicationViewConfig = ConfigFromSchema<typeof OperationsDecimalStandardMultiplicationViewSchema>;
