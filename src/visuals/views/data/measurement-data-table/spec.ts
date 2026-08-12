import {Ability} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-data-table',
    generalLabels: [Ability.ProcedureExecution]
};

export const MeasurementDataTableViewSchema = {} as const;
export type MeasurementDataTableViewConfig = ConfigFromSchema<typeof MeasurementDataTableViewSchema>;
