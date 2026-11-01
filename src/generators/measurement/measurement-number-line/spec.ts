import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, withLabelChoices} from '../../../types/schema.ts';
import {measurementLineRangeProfiles} from './numeric-domain.ts';

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
    generalLabels: [Scope.NumbersWithoutNegatives, Scope.NumbersWithZero]
};

const rangeChoices = measurementLineRangeProfiles.map(profile => profile.labels);
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
    ],
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        measurementLineRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;

export type MeasurementNumberLineGeneratorConfig = ConfigFromSchema<
    typeof MeasurementNumberLineGeneratorSchema
>;
