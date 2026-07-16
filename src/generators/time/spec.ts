import {Area, Scope} from 'edugraph-ts';

export const spec: TimeGeneratorSpec = {
    generatorId: 'time',
    supportedLabels: [
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals
    ],
};
