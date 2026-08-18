import {Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const resolveOperation: ResolverFn<Area.Addition | Area.Subtraction | 'none'> = labels =>
    labels.includes(Area.Addition)
        ? Area.Addition
        : labels.includes(Area.Subtraction) ? Area.Subtraction : 'none';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-data',
    generalLabels: [
        Area.Statistics,
        Area.MeasuringObjects
    ]
};

export const MeasurementDataGeneratorSchema = {
    numberKind: [Scope.IntegerNumbers, Scope.FractionNumbers],
    linePlotFeatures: [
        [Area.FractionArithmetic, Scope.SingleFrameOfReference],
        matchAllExactLabels
    ],
    operation: [[Area.Addition, Area.Subtraction], resolveOperation]
} as const;
export type MeasurementDataGeneratorConfig = ConfigFromSchema<typeof MeasurementDataGeneratorSchema>;
