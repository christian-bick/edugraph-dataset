import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {
    MeasurementConversionPairId
} from '../../../types/problems.ts';

export type MeasurementConversionUnitPairConfig =
    | MeasurementConversionPairId
    | 'generic-unit-scale';

const resolveTask = selectExactLabelSetMap([
    [[], 'convert-larger-to-smaller'],
    [[Area.UnitScaleRelation], 'relative-unit-size'],
    [[Scope.ConversionTable], 'conversion-table']
] as const);

const unitPairFallbacks = [
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.WeightMeasurement, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.WeightMeasurement, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.MinuteIntervals, Scope.SecondIntervals]
] as const;

const unitPairValues = [
    'kilometer-meter',
    'meter-centimeter',
    'kilogram-gram',
    'pound-ounce',
    'liter-milliliter',
    'hour-minute',
    'minute-second'
] as const satisfies readonly MeasurementConversionPairId[];

const resolveUnitPair = selectExactLabelSetMap([
    ...unitPairFallbacks.map((labels, index) => [labels, unitPairValues[index]!] as const),
    [[Area.UnitScaleRelation, Scope.LengthMeasurement], 'generic-unit-scale'],
    ...unitPairFallbacks.map((labels, index) => [
        [Area.UnitScaleRelation, ...labels],
        unitPairValues[index]!
    ] as const)
]);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion',
    generalLabels: [Area.MeasuringWithUnits]
};

export const MeasurementConversionGeneratorSchema = {
    task: [
        [Area.UnitScaleRelation, Scope.ConversionTable],
        resolveTask,
        [[]]
    ],
    unitPair: [
        [
            Area.UnitMagnitudeScaling,
            Area.UnitFactorScaling,
            Scope.LengthMeasurement,
            Scope.WeightMeasurement,
            Scope.VolumeMeasurement,
            Scope.TimeMeasurement,
            Scope.KilometerScale,
            Scope.MeterScale,
            Scope.CentimeterScale,
            Scope.KilogramScale,
            Scope.GramScale,
            Scope.PoundScale,
            Scope.OunceScale,
            Scope.LiterScale,
            Scope.MilliliterScale,
            Scope.HourIntervals,
            Scope.MinuteIntervals,
            Scope.SecondIntervals,
            Scope.LiquidVolumes
        ],
        resolveUnitPair,
        unitPairFallbacks
    ]
} as const;

export type MeasurementConversionGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionGeneratorSchema
>;
