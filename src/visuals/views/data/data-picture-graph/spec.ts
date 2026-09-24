import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph',
    generalLabels: [Scope.PictureGraph, Ability.VisualArticulation],
    compatibility: [
        rejectTargetLabels('categorical-task-boundary', [Scope.SingleStep, Scope.MultiStep])
    ]
};

export const DataPictureGraphViewSchema = {} as const;
export type DataPictureGraphViewConfig = ConfigFromSchema<typeof DataPictureGraphViewSchema>;
