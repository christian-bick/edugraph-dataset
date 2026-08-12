import {Ability, Area} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-estimate',
    generalLabels: [Ability.ProcedureExecution],
    rejectedLabels: [Area.MeasuringObjects, Ability.VisualReception, Ability.VisualArticulation]
};
export const MeasureLengthEstimateViewSchema = {} as const;
export type MeasureLengthEstimateViewConfig = ConfigFromSchema<typeof MeasureLengthEstimateViewSchema>;
