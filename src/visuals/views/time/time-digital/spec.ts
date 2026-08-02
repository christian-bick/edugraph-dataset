import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'time-digital',
    generalLabels: [
        Scope.DigitalClock,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.VisualReception
    ]
};

export const TimeDigitalViewSchema = {
    isReverse: [
        [Ability.VisualArticulation],
        hasLabel(Ability.VisualArticulation)
    ]
} as const;

export type TimeDigitalViewConfig = ConfigFromSchema<typeof TimeDigitalViewSchema>;
