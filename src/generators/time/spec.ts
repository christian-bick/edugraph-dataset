import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel, selectExactMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time',
    generalLabels: [
        Area.MeasuringTime,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        ...deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100])
    ],
};


export const TimeGeneratorSchema = {
    intervalLabel: [
        [Scope.SecondIntervals, Scope.MinuteIntervals, Scope.HalfHourIntervals, Scope.HourIntervals],
        selectExactMatch
    ],
    requireZero: [
        [Scope.NumbersWithZero],
        hasLabel(Scope.NumbersWithZero)
    ]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
