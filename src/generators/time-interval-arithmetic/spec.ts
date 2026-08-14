import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {GeneratorSpec} from '../../types/generator-spec.ts';
import {resolveExplicitOperation} from '../arithmetic/helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time-interval-arithmetic',
    generalLabels: [
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Scope.TwoOperands
    ]
};

export const TimeIntervalArithmeticGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], resolveExplicitOperation]
} as const;

export type TimeIntervalArithmeticGeneratorConfig = ConfigFromSchema<
    typeof TimeIntervalArithmeticGeneratorSchema
>;
