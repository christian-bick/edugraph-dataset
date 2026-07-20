import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-attributes',
    supportedLabels: [
        Ability.VisualReception,
        Ability.ProcedureExecution,
        Scope.NumbersWithoutZero
    ]
};


export const MeasureAttributesViewSchema = {} as const;

export type MeasureAttributesViewConfig = ConfigFromSchema<typeof MeasureAttributesViewSchema>;
