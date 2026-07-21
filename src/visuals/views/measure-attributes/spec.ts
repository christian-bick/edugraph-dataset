import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-attributes',
    generalLabels: [
        Ability.VisualReception,
        Ability.ProcedureExecution,
    ]
};


export const MeasureAttributesViewSchema = {} as const;

export type MeasureAttributesViewConfig = ConfigFromSchema<typeof MeasureAttributesViewSchema>;
