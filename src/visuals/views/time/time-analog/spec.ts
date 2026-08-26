import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'time-analog',
    generalLabels: [
        Scope.AnalogClock,
        Ability.VisualReception,
        Ability.ProcedureExecution,
        Ability.Interpretation,
        Ability.Formalization
    ]
};

export const TimeAnalogViewSchema = {} as const;

export type TimeAnalogViewConfig = ConfigFromSchema<typeof TimeAnalogViewSchema>;
