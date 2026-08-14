import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-mass',
    generalLabels: [Ability.ProcedureExecution],
    rejectedLabels: [...deductAdmitting([Scope.VolumeMeasurement])]
};

export const MeasureMassViewSchema = {} as const;

export type MeasureMassViewConfig = ConfigFromSchema<typeof MeasureMassViewSchema>;
