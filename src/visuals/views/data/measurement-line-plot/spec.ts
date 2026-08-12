import {Ability, Scope} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-line-plot',
    generalLabels: [Scope.LinePlot, Scope.StepsOf1, Ability.VisualArticulation]
};

export const MeasurementLinePlotViewSchema = {} as const;
export type MeasurementLinePlotViewConfig = ConfigFromSchema<typeof MeasurementLinePlotViewSchema>;
