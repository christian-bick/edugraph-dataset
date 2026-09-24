import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel, selectExactMatch} from '../../lib/resolvers.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time',
    compatibility: [generatorLabelRule('clock-period-and-interval', [
        Scope.AnteMeridiem, Scope.PostMeridiem, Scope.StepsOf5, Scope.MinuteIntervals
    ], selected => !(selected(Scope.AnteMeridiem) && selected(Scope.PostMeridiem))
        && (!selected(Scope.StepsOf5) || selected(Scope.MinuteIntervals)))],
    generalLabels: [Area.MeasuringTime],
};


export const TimeGeneratorSchema = {
    intervalLabel: [
        [Scope.SecondIntervals, Scope.MinuteIntervals, Scope.HalfHourIntervals, Scope.HourIntervals],
        selectExactMatch
    ],
    requireZero: [
        [Scope.NumbersWithZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireFiveMinuteStep: [
        [Scope.StepsOf5],
        hasLabel(Scope.StepsOf5)
    ],
    isAnteMeridiem: [
        [Scope.AnteMeridiem],
        hasLabel(Scope.AnteMeridiem)
    ],
    isPostMeridiem: [
        [Scope.PostMeridiem],
        hasLabel(Scope.PostMeridiem)
    ]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
