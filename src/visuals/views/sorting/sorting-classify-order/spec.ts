import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-order',
    generalLabels: [
        Ability.ProcedureExecution,
        Area.ShapeRecognition,
        Area.NumericOrder,
        Scope.ArabicNumerals,
        Scope.Base10
    ],
    compatibility: [requireTargetLabels('complete-category-order-request', [Area.NumericOrder]), {
        id: 'complete-category-order-relation',
        dependencies: [
            {scope: 'generator', label: Scope.AscendingOrder},
            {scope: 'generator', label: Scope.DescendingOrder}
        ],
        predicate: labels => labels.has('generator', Scope.AscendingOrder)
            || labels.has('generator', Scope.DescendingOrder)
    }]
};

export const SortingClassifyOrderViewSchema = {} as const;
export type SortingClassifyOrderViewConfig = ConfigFromSchema<typeof SortingClassifyOrderViewSchema>;
