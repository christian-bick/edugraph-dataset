import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-multiplication-standard-algorithm',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};

export const OperationsMultiplicationStandardAlgorithmViewSchema = {} as const;
export type OperationsMultiplicationStandardAlgorithmViewConfig = ConfigFromSchema<
    typeof OperationsMultiplicationStandardAlgorithmViewSchema
>;
