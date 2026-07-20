import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time',
    generalLabels: [
        Area.MeasuringTime,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithZero,
        Scope.NumbersWithoutNegatives,
        ...deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100])
    ],
};


export const TimeGeneratorSchema = {
    intervalLabel: [
        [Scope.SecondIntervals, Scope.MinuteIntervals, Scope.HourIntervals],
        selectExactMatch
    ]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
