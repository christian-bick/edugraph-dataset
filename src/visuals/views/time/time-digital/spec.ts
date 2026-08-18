import {Ability, Scope} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-digital',
    generalLabels: [
        Scope.DigitalClock,
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.TextualReception
    ]
};

export const TimeDigitalViewSchema = {
    taskAbilities: [
        [Ability.ProcedureExecution, Ability.VisualArticulation, Ability.Formalization],
        matchAllExactLabels
    ]
} as const;

export type TimeDigitalViewConfig = ConfigFromSchema<typeof TimeDigitalViewSchema>;
