import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph',
    generalLabels: [
        Scope.BarGraph,
        Ability.VisualArticulation
    ]
};

export const DataBarGraphViewSchema = {} as const;

export type DataBarGraphViewConfig = ConfigFromSchema<typeof DataBarGraphViewSchema>;
