import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-order',
    generalLabels: [Ability.ProcedureExecution]
};

export const MeasureOrderViewSchema = {} as const;

export type MeasureOrderViewConfig = ConfigFromSchema<typeof MeasureOrderViewSchema>;
