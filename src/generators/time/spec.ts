import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {clockIntervals, clockProfileChoices, resolveClockProfile} from './clock-profile.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec<typeof TimeGeneratorSchema> = {
    generatorId: 'time',
    compatibility: [generatorLabelRule('clock-period-and-interval', [
        Scope.AnteMeridiem, Scope.PostMeridiem, Scope.MultiplesOf5, Scope.MinuteIntervals, Scope.NumbersWithZero
    ], selected => !(selected(Scope.AnteMeridiem) && selected(Scope.PostMeridiem))
        && (!selected(Scope.MultiplesOf5) || selected(Scope.MinuteIntervals) && !selected(Scope.NumbersWithZero)))],
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
    ]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
