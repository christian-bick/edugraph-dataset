import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-classification',
    generalLabels: [Scope.BarGraph, Ability.ConceptClassification, Ability.VisualArticulation]
};

export const DataBarGraphClassificationViewSchema = {} as const;
export type DataBarGraphClassificationViewConfig = ConfigFromSchema<typeof DataBarGraphClassificationViewSchema>;
