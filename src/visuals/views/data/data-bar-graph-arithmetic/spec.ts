import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {barGraphCompatibility, BarGraphViewSchema} from '../bar-graph-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-arithmetic',
    compatibility: barGraphCompatibility,
    generalLabels: [Scope.BarGraph, Ability.ProcedureExecution]
};

export const DataBarGraphArithmeticViewSchema = BarGraphViewSchema;
export type DataBarGraphArithmeticViewConfig = ConfigFromSchema<typeof DataBarGraphArithmeticViewSchema>;
