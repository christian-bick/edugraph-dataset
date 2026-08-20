import {Ability, Area} from 'edugraph-ts';
import {DISTANCE_SCALE_LABELS, resolveDistanceScale} from '../../../../lib/ontology.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-estimate',
    generalLabels: [Ability.ProcedureExecution],
    rejectedLabels: [Area.MeasuringObjects]
};
export const MeasureLengthEstimateViewSchema = {
    scale: [DISTANCE_SCALE_LABELS, resolveDistanceScale]
} as const;
export type MeasureLengthEstimateViewConfig = ConfigFromSchema<typeof MeasureLengthEstimateViewSchema>;
