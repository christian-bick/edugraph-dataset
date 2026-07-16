import {GeneratorSpec} from '../../types/generator-spec.ts';
import {VisualBlueprint} from '../../types/ml-engine.ts';
import {Area, Scope} from 'edugraph-ts';

export interface TimeGeneratorSpec extends GeneratorSpec {
    visualDistribution: VisualBlueprint[];
}

export const spec: TimeGeneratorSpec = {
    generatorId: 'time',
    supportedLabels: [
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals,
        Scope.MinuteIntervals,
        Scope.SecondIntervals
    ],
    visualDistribution: [
        { viewId: 'time-analog', constraints: { reverse: false }, instancesPerProblem: 1 },
        { viewId: 'time-analog', constraints: { reverse: true }, instancesPerProblem: 1 }
    ]
};
