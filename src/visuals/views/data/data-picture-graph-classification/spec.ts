import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph-classification',
    generalLabels: [Scope.PictureGraph, Ability.ConceptClassification, Ability.VisualArticulation],
    rejectedLabels: [Scope.SingleStep, Scope.MultiStep]
};
export const DataPictureGraphClassificationViewSchema = {} as const;
export type DataPictureGraphClassificationViewConfig = ConfigFromSchema<typeof DataPictureGraphClassificationViewSchema>;
