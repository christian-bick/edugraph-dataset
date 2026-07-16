import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'time-analog',
    supportedLabels: [
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.VisualReception,
        Ability.VisualArticulation
    ],
    constraints: {
        interval: { type: 'options', values: [3600, 1800, 900, 60, 1] }
    },};
