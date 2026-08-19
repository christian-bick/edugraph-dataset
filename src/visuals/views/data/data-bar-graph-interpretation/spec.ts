import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-bar-graph-interpretation',
    generalLabels: [Scope.BarGraph, Ability.Interpretation]
};

export const DataBarGraphInterpretationViewSchema = {} as const;
export type DataBarGraphInterpretationViewConfig = ConfigFromSchema<typeof DataBarGraphInterpretationViewSchema>;
