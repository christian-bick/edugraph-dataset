import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveExplicitOperation} from '../../arithmetic/helpers.ts';

export const measurementWordProblemKinds = [
    Scope.LengthMeasurement,
    Scope.TimeMeasurement,
    Scope.LiquidVolumes,
    Scope.WeightMeasurement,
    Scope.Dollar
] as const;

export const measurementWordProblemNumberKinds = [
    Scope.IntegerNumbers,
    Scope.FractionNumbers,
    Scope.DecimalNumbers
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'measurement-word-problems',
    generalLabels: [Scope.SingleStep, Scope.TwoOperands]
};

export const MeasurementWordProblemsGeneratorSchema = {
    measurementKind: [
        [
            Scope.LengthMeasurement,
            Scope.TimeMeasurement,
            Scope.VolumeMeasurement,
            Scope.LiquidVolumes,
            Scope.WeightMeasurement,
            Scope.Dollar,
            Scope.MeterScale,
            Scope.HourIntervals,
            Scope.LiterScale,
            Scope.KilogramScale
        ],
        selectCanonicalLabel([
            [[Scope.LengthMeasurement, Scope.MeterScale], 'length'],
            [[Scope.TimeMeasurement, Scope.HourIntervals], 'time'],
            [[Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale], 'liquid-volume'],
            [[Scope.WeightMeasurement, Scope.KilogramScale], 'weight'],
            [[Scope.Dollar], 'money']
        ])
    ],
    physicalMeasurement: [[Area.MeasuringWithUnits], hasLabel(Area.MeasuringWithUnits)],
    numberKind: [
        measurementWordProblemNumberKinds,
        selectCanonicalLabel([
            [[Scope.IntegerNumbers], 'integer'],
            [[Scope.FractionNumbers], 'fraction'],
            [[Scope.DecimalNumbers], 'decimal']
        ])
    ],
    operation: [arithmeticOperations, resolveExplicitOperation]
} as const;

export type MeasurementWordProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementWordProblemsGeneratorSchema
>;
