import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-arithmetic',
    generalLabels: [Scope.BarGraph, Ability.ProcedureExecution]
};

export const DataBarGraphArithmeticViewSchema = {} as const;
export type DataBarGraphArithmeticViewConfig = ConfigFromSchema<typeof DataBarGraphArithmeticViewSchema>;
