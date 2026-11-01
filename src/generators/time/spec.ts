import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {clockIntervals, clockProfileChoices, resolveClockProfile} from './clock-profile.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';
import {resolveCanonicalRangeFromLabels} from '../../lib/canonical-range-labels.ts';
import {clockRangeChoices, clockRangeContext, clockRangeLabels, permitsClockRange, resolveClockRange} from './range-profile.ts';

export const spec: GeneratorSpec<typeof TimeGeneratorSchema> = {
    generatorId: 'time',
    compatibility: [generatorLabelRule('clock-period-and-interval', [
        Scope.AnteMeridiem, Scope.PostMeridiem, Scope.MultiplesOf5, Scope.MinuteIntervals, Scope.NumbersWithZero
    ], selected => !(selected(Scope.AnteMeridiem) && selected(Scope.PostMeridiem))
        && (!selected(Scope.MultiplesOf5) || selected(Scope.MinuteIntervals) && !selected(Scope.NumbersWithZero))),
        generatorLabelRule('clock-canonical-range', [...clockRangeLabels, ...clockRangeContext], selected => {
            const labels = [...clockRangeLabels, ...clockRangeContext].filter(selected);
            const range = resolveCanonicalRangeFromLabels(labels);
            return range !== undefined && permitsClockRange(labels, range);
        })],
    generalLabels: [Area.MeasuringTime, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives],
};


export const TimeGeneratorSchema = {
    clockProfile: [
        [...clockIntervals, Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        resolveClockProfile,
        clockProfileChoices
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
    ],
    range: [clockRangeLabels, resolveClockRange, clockRangeChoices]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
