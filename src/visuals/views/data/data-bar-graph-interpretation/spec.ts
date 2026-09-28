import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {barGraphCompatibility, BarGraphViewSchema} from '../bar-graph-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-interpretation',
    compatibility: barGraphCompatibility,
    generalLabels: [Scope.BarGraph, Ability.Interpretation]
};

export const DataBarGraphInterpretationViewSchema = BarGraphViewSchema;
export type DataBarGraphInterpretationViewConfig = ConfigFromSchema<typeof DataBarGraphInterpretationViewSchema>;
