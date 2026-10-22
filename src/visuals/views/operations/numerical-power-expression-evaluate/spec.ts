import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numerical-power-expression-evaluate',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution]
};
export const NumericalPowerExpressionEvaluateViewSchema = {} as const;
export type NumericalPowerExpressionEvaluateViewConfig = ConfigFromSchema<typeof NumericalPowerExpressionEvaluateViewSchema>;
