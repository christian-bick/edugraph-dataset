import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-liquid-volume-estimate',
    generalLabels: [Ability.ProcedureExecution],
    rejectedLabels: [...deductAdmitting([Scope.WeightMeasurement])]
};

export const MeasureLiquidVolumeEstimateViewSchema = {} as const;

export type MeasureLiquidVolumeEstimateViewConfig = ConfigFromSchema<
    typeof MeasureLiquidVolumeEstimateViewSchema
>;
