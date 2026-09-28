import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {barGraphCompatibility, BarGraphViewSchema} from '../bar-graph-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph',
    compatibility: barGraphCompatibility,
    generalLabels: [
        Scope.BarGraph,
        Ability.VisualArticulation
    ]
};

export const DataBarGraphViewSchema = BarGraphViewSchema;

export type DataBarGraphViewConfig = ConfigFromSchema<typeof DataBarGraphViewSchema>;
