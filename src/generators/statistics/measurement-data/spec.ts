import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver} from '../../../types/schema.ts';

const resolveOperation = selectExactLabelSetMap([
    [[], 'none'],
    [[Area.Addition], Area.Addition],
    [[Area.Subtraction], Area.Subtraction]
] as const);

const resolveUnitScale = exactResolver((labels: string[]): Scope.CentimeterScale | Scope.InchScale => {
    const exactScale = selectExactLabelMap([
        [Scope.CentimeterScale, Scope.CentimeterScale],
        [Scope.InchScale, Scope.InchScale]
    ] as const)(labels);
    if (exactScale) return exactScale;
    return labels.includes(Scope.FractionNumbers) ? Scope.InchScale : Scope.CentimeterScale;
});

export const spec: GeneratorSpec = {
    generatorId: 'measurement-data',
    generalLabels: [
        Area.Statistics,
        Area.Measurement,
        Scope.LengthMeasurement
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
