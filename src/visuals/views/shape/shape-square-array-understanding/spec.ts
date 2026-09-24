import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-square-array-understanding',
    generalLabels: [Ability.ProcedureUnderstanding],
    compatibility: [
        requireTargetLabels('box-arrangement-request', [Scope.BoxArrangement])
    ]
};
export const ShapeSquareArrayUnderstandingViewSchema = {} as const;
export type ShapeSquareArrayUnderstandingViewConfig = ConfigFromSchema<
    typeof ShapeSquareArrayUnderstandingViewSchema
>;
