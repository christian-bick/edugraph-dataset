import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {GeneratorSpec} from '../../types/generator-spec.ts';
import {resolveDeclaredOperation} from '../arithmetic/helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'time-interval-arithmetic',
    generalLabels: [
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.IntegerNumbers,
        Scope.SingleStep
    ]
};

export const TimeIntervalArithmeticGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], resolveDeclaredOperation]
} as const;

export type TimeIntervalArithmeticGeneratorConfig = ConfigFromSchema<
    typeof TimeIntervalArithmeticGeneratorSchema
>;
