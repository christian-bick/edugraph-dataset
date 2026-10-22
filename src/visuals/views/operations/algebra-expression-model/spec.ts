import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-expression-model',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('algebra-quantitative-model-task', [Area.AlgebraicModeling])
    ]
};
export const AlgebraExpressionModelViewSchema = {} as const;
export type AlgebraExpressionModelViewConfig = ConfigFromSchema<typeof AlgebraExpressionModelViewSchema>;
