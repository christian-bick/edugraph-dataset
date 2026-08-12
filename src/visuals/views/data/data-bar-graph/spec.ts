import {Ability, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph',
    generalLabels: [Scope.BarGraph, Scope.StepsOf1]
};

export const DataBarGraphViewSchema = {
    taskAbility: [[Ability.VisualArticulation, Ability.ProcedureExecution], selectExactMatch]
} as const;

export type DataBarGraphViewConfig = ConfigFromSchema<typeof DataBarGraphViewSchema>;
