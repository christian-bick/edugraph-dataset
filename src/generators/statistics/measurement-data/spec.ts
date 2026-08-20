import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const resolveOperation: ResolverFn<Area.Addition | Area.Subtraction | 'none'> = labels =>
    labels.includes(Area.Addition)
        ? Area.Addition
        : labels.includes(Area.Subtraction) ? Area.Subtraction : 'none';

const resolveUnitScale: ResolverFn<Scope.CentimeterScale | Scope.InchScale> = labels => {
    if (labels.includes(Scope.InchScale)) return Scope.InchScale;
    if (labels.includes(Scope.CentimeterScale)) return Scope.CentimeterScale;
    return labels.includes(Scope.FractionNumbers) ? Scope.InchScale : Scope.CentimeterScale;
};

export const spec: GeneratorSpec = {
    generatorId: 'measurement-data',
    generalLabels: [
        Area.Statistics,
        Area.Measurement
    ]
};

export const MeasurementDataGeneratorSchema = {
    numberKind: [Scope.IntegerNumbers, Scope.FractionNumbers],
    unitScale: [[Scope.CentimeterScale, Scope.InchScale], resolveUnitScale],
    useSingleFrame: [[Scope.SingleFrameOfReference], hasLabel(Scope.SingleFrameOfReference)],
    includeFractionArithmetic: [[Area.FractionArithmetic], hasLabel(Area.FractionArithmetic)],
    operation: [[Area.Addition, Area.Subtraction], resolveOperation]
} as const;
export type MeasurementDataGeneratorConfig = ConfigFromSchema<typeof MeasurementDataGeneratorSchema>;
