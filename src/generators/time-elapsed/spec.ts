import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {GeneratorSpec} from '../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time-elapsed',
    generalLabels: [
        Area.MeasuringTime,
        Area.Difference,
        Scope.MinuteIntervals
    ]
};

export const TimeElapsedGeneratorSchema = {
    requireElapsedCount: [
        [Scope.IntegerNumbers],
        hasLabel(Scope.IntegerNumbers)
    ]
} as const;

export type TimeElapsedGeneratorConfig = ConfigFromSchema<
    typeof TimeElapsedGeneratorSchema
>;
