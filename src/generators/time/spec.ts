import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'time',
    supportedLabels: [
        Area.MeasuringTime,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals
    ],
};
