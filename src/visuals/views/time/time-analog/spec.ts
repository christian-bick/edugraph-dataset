import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { hasLabel } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'time-analog',
    generalLabels: [
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.VisualReception
    ]
};


export const TimeAnalogViewSchema = {
    // TODO: Consider ontological relations for time intervals
    isReverse: [
        [Ability.VisualArticulation],
        hasLabel(Ability.VisualArticulation)
    ]
} as const;

export type TimeAnalogViewConfig = ConfigFromSchema<typeof TimeAnalogViewSchema>;
