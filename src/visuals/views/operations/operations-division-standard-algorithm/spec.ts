import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-division-standard-algorithm',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};

export const OperationsDivisionStandardAlgorithmViewSchema = {} as const;
export type OperationsDivisionStandardAlgorithmViewConfig = ConfigFromSchema<
    typeof OperationsDivisionStandardAlgorithmViewSchema
>;
