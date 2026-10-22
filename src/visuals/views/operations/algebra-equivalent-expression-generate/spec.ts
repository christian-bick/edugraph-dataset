import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-equivalent-expression-generate',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('algebra-equivalence-rewrite-task', [Area.AlgebraicExpression, Area.AlgebraicEquivalence])
    ]
};
export const AlgebraEquivalentExpressionGenerateViewSchema = {} as const;
export type AlgebraEquivalentExpressionGenerateViewConfig = ConfigFromSchema<typeof AlgebraEquivalentExpressionGenerateViewSchema>;
