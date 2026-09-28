import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {barGraphCompatibility, BarGraphViewSchema} from '../bar-graph-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-classification',
    compatibility: barGraphCompatibility,
    generalLabels: [Scope.BarGraph, Ability.ConceptClassification, Ability.VisualArticulation]
};

export const DataBarGraphClassificationViewSchema = BarGraphViewSchema;
export type DataBarGraphClassificationViewConfig = ConfigFromSchema<typeof DataBarGraphClassificationViewSchema>;
