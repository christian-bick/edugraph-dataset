import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-array-total',
    generalLabels: [
        Scope.NumberArray,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};

export const OperationsNumberArrayTotalViewSchema = {} as const;

export type OperationsNumberArrayTotalViewConfig = ConfigFromSchema<
    typeof OperationsNumberArrayTotalViewSchema
>;
