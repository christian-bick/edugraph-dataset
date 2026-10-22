import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-expression-evaluate',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('algebra-substitution-calculation-task', [Area.AlgebraicSubstitution, Area.OrderOfOperations])
    ]
};
export const AlgebraExpressionEvaluateViewSchema = {} as const;
export type AlgebraExpressionEvaluateViewConfig = ConfigFromSchema<typeof AlgebraExpressionEvaluateViewSchema>;
