import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { matchAllExactLabels } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'time-analog',
    generalLabels: [
        Scope.AnalogClock,
        Scope.ArabicNumerals,
        Ability.VisualReception
    ]
};


export const TimeAnalogViewSchema = {
    taskAbilities: [
        [
            Ability.ProcedureExecution,
            Ability.VisualArticulation,
            Ability.Interpretation,
            Ability.Formalization
        ],
        matchAllExactLabels
    ]
} as const;

export type TimeAnalogViewConfig = ConfigFromSchema<typeof TimeAnalogViewSchema>;
