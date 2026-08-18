import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-add-subtract-strategy',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const OperationsAddSubtractStrategyViewSchema = {} as const;

export type OperationsAddSubtractStrategyViewConfig = ConfigFromSchema<
    typeof OperationsAddSubtractStrategyViewSchema
>;
