import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-grouping-write',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization],
    compatibility: [
        requireTargetLabels('grouped-expression-request', [Area.GroupedExpression])
    ]
};

export const OperationsGroupingWriteViewSchema = {} as const;

export type OperationsGroupingWriteViewConfig = ConfigFromSchema<typeof OperationsGroupingWriteViewSchema>;
