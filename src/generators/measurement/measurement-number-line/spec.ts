import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const measurementNumberLineKinds = [
    Scope.MeterScale,
    Scope.HourIntervals,
    Scope.LiquidVolumes,
    Scope.KilogramScale,
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
            Scope.VolumeMeasurement,
            Scope.LiquidVolumes,
            Scope.Dollar,
            Scope.MeterScale,
            Scope.HourIntervals,
            Scope.LiterScale,
            Scope.KilogramScale
        ],
        selectExactLabelSetMap([
            [[Scope.MeterScale], 'length'],
            [[Scope.HourIntervals], 'time'],
            [[Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale], 'liquid-volume'],
            [[Scope.KilogramScale], 'weight'],
            [[Scope.Dollar], 'money']
        ]),
        [
            [Scope.MeterScale],
            [Scope.HourIntervals],
            [Scope.LiquidVolumes, Scope.VolumeMeasurement, Scope.LiterScale],
            [Scope.KilogramScale],
            [Scope.Dollar]
        ]
    ],
    numberKind: [
        [Area.NumerationWithFractions, Area.NumerationWithDecimals, ...measurementNumberLineNumberKinds],
        selectExactLabelSetMap([
            [[Area.NumerationWithFractions, Scope.ProperFractions], 'fraction'],
            [[Area.NumerationWithDecimals, Scope.DecimalNumbers], 'decimal']
        ]),
        [
            [Area.NumerationWithFractions, Scope.ProperFractions],
            [Area.NumerationWithDecimals, Scope.DecimalNumbers]
        ]
    ]
} as const;

export type MeasurementNumberLineGeneratorConfig = ConfigFromSchema<
    typeof MeasurementNumberLineGeneratorSchema
>;
