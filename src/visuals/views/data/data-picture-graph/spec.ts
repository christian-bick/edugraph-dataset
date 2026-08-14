import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph',
    generalLabels: [Scope.PictureGraph, Ability.VisualArticulation]
};

export const DataPictureGraphViewSchema = {} as const;
export type DataPictureGraphViewConfig = ConfigFromSchema<typeof DataPictureGraphViewSchema>;
