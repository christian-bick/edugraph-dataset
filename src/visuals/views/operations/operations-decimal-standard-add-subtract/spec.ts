import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decimal-standard-add-subtract',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};
export const OperationsDecimalStandardAddSubtractViewSchema = {} as const;
export type OperationsDecimalStandardAddSubtractViewConfig = ConfigFromSchema<typeof OperationsDecimalStandardAddSubtractViewSchema>;
