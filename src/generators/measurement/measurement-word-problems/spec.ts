import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../../arithmetic/helpers.ts';

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
    generalLabels: [Area.MeasuringWithUnits, Scope.SingleStep, Scope.TwoOperands]
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
        selectExactLabelSetMap([
            [[Scope.LengthMeasurement, Scope.MeterScale], 'length'],
            [[Scope.TimeMeasurement, Scope.HourIntervals], 'time'],
            [[Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale], 'liquid-volume'],
            [[Scope.WeightMeasurement, Scope.KilogramScale], 'weight'],
            [[Scope.Dollar], 'money']
        ]),
        [
            [Scope.LengthMeasurement, Scope.MeterScale],
            [Scope.TimeMeasurement, Scope.HourIntervals],
            [Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale],
            [Scope.WeightMeasurement, Scope.KilogramScale],
            [Scope.Dollar]
        ]
    ],
    numberKind: [
        measurementWordProblemNumberKinds,
        selectExactLabelMap([
            [Scope.IntegerNumbers, 'integer'],
            [Scope.FractionNumbers, 'fraction'],
            [Scope.DecimalNumbers, 'decimal']
        ])
    ],
    operation: [arithmeticOperations, resolveDeclaredOperation]
} as const;

export type MeasurementWordProblemsGeneratorConfig = ConfigFromSchema<
    typeof MeasurementWordProblemsGeneratorSchema
>;
