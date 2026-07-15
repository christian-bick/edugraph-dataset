import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'time-analog',
    supportedLabels: [
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals,
        Ability.ProcedureExecution
    ],
    constraints: {
        interval: { type: 'options', values: [3600, 1800, 900, 60, 1] },
        reverse: { type: 'options', values: [true, false] }
    },
    testParams: {
        interval: (c) => allOptions(c),
        reverse: (c) => allOptions(c),
        time: (key, params) => {
            if (params.interval === 1) return '10:15:30';
            if (params.interval === 60) return '10:15:00';
            return '10:30:00';
        }
    }
};
