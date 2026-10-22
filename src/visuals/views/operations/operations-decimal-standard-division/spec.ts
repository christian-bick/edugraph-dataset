import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decimal-standard-division',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};
export const OperationsDecimalStandardDivisionViewSchema = {} as const;
export type OperationsDecimalStandardDivisionViewConfig = ConfigFromSchema<typeof OperationsDecimalStandardDivisionViewSchema>;
