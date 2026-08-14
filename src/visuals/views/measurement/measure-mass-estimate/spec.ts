import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-mass-estimate',
    generalLabels: [Ability.ProcedureExecution],
    rejectedLabels: [...deductAdmitting([Scope.VolumeMeasurement])]
};

export const MeasureMassEstimateViewSchema = {} as const;
export type MeasureMassEstimateViewConfig = ConfigFromSchema<typeof MeasureMassEstimateViewSchema>;
