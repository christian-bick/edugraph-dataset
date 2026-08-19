import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph-interpretation',
    generalLabels: [Scope.PictureGraph, Ability.Interpretation],
    rejectedLabels: [Scope.SingleStep, Scope.MultiStep]
};
export const DataPictureGraphInterpretationViewSchema = {} as const;
export type DataPictureGraphInterpretationViewConfig = ConfigFromSchema<typeof DataPictureGraphInterpretationViewSchema>;
