import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel, selectExactMatch} from '../../lib/resolvers.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec<typeof TimeGeneratorSchema> = {
    generatorId: 'time',
    compatibility: [generatorLabelRule('clock-period-and-interval', [
        Scope.AnteMeridiem, Scope.PostMeridiem, Scope.MultiplesOf5, Scope.MinuteIntervals
    ], selected => !(selected(Scope.AnteMeridiem) && selected(Scope.PostMeridiem))
        && (!selected(Scope.MultiplesOf5) || selected(Scope.MinuteIntervals)))],
    generalLabels: [Area.MeasuringTime, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives],
    // SPEC-12: neither the interval nor the false zero predicate alone proves absence.
    // Conditional aliases would change direct fallback sampling. At these precisions,
    // every consumer uses positive 12-hour components and omits the stored zero seconds.
    inferredLabels: [{
        // All four consumers require the minute component, which is zero at whole hours.
        // Keep the existing precision selector and its direct fallback sampling unchanged.
        produces: [Scope.NumbersWithZero],
        infer: ({intervalLabel}) => intervalLabel === Scope.HourIntervals ? [Scope.NumbersWithZero] : []
    }, {
        produces: [Scope.NumbersWithoutZero],
        infer: ({intervalLabel, requireZero, requireMultipleOf5}) => !requireZero
            && (intervalLabel === Scope.HalfHourIntervals
                || intervalLabel === Scope.MinuteIntervals && requireMultipleOf5)
            ? [Scope.NumbersWithoutZero]
            : []
    }],
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
    requireMultipleOf5: [
        [Scope.MultiplesOf5],
        hasLabel(Scope.MultiplesOf5)
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
