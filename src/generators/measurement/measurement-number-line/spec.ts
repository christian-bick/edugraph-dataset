import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const measurementNumberLineKinds = [
    Scope.LengthMeasurement,
    Scope.TimeMeasurement,
    Scope.LiquidVolumes,
    Scope.WeightMeasurement,
    Scope.Dollar
] as const;

export const measurementNumberLineNumberKinds = [
    Scope.ProperFractions,
    Scope.DecimalNumbers
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'measurement-number-line',
    generalLabels: []
};

export const MeasurementNumberLineGeneratorSchema = {
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
        measurementNumberLineNumberKinds,
        selectCanonicalLabel([
            [[Scope.ProperFractions, Scope.FractionNumbers], 'fraction'],
            [[Scope.DecimalNumbers], 'decimal']
        ])
    ]
} as const;

export type MeasurementNumberLineGeneratorConfig = ConfigFromSchema<
    typeof MeasurementNumberLineGeneratorSchema
>;
