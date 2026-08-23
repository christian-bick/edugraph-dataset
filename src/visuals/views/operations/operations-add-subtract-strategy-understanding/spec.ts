import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-add-subtract-strategy-understanding',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureUnderstanding]
};

export const OperationsAddSubtractStrategyUnderstandingViewSchema = {} as const;

export type OperationsAddSubtractStrategyUnderstandingViewConfig = ConfigFromSchema<
    typeof OperationsAddSubtractStrategyUnderstandingViewSchema
>;
