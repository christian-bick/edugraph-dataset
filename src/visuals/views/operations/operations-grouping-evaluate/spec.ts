import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-grouping-evaluate',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('grouped-expression-request', [Area.GroupedExpression])
    ]
};

export const OperationsGroupingEvaluateViewSchema = {} as const;

export type OperationsGroupingEvaluateViewConfig = ConfigFromSchema<typeof OperationsGroupingEvaluateViewSchema>;
