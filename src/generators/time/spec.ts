import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {extractFirstMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time',
    generalLabels: [
        Area.MeasuringTime
    ],
};


export const TimeGeneratorSchema = {
    // TODO: Consider defining ontological relations for time intervals in the future
    // rather than extracting the first match, so we could deduct compatible intervals.
    intervalLabel: [
        [Scope.SecondIntervals, Scope.MinuteIntervals, Scope.HourIntervals],
        extractFirstMatch
    ]
} as const;

export type TimeGeneratorConfig = ConfigFromSchema<typeof TimeGeneratorSchema>;
