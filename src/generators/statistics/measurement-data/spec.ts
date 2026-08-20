import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
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
        Area.Measurement
    ]
};

export const MeasurementDataGeneratorSchema = {
    numberKind: [Scope.IntegerNumbers, Scope.FractionNumbers],
    useSingleFrame: [[Scope.SingleFrameOfReference], hasLabel(Scope.SingleFrameOfReference)],
    includeFractionArithmetic: [[Area.FractionArithmetic], hasLabel(Area.FractionArithmetic)],
    operation: [[Area.Addition, Area.Subtraction], resolveOperation]
} as const;
export type MeasurementDataGeneratorConfig = ConfigFromSchema<typeof MeasurementDataGeneratorSchema>;
