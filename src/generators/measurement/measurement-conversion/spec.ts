import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {
    MeasurementConversionPairId
} from '../../../types/problems.ts';

const unitPairFallbacks = [
    [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals]
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
    ...unitPairFallbacks.map((labels, index) => [labels, unitPairValues[index]!] as const)
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion',
    generalLabels: [Area.UnitScaleRelation]
};

export const MeasurementConversionGeneratorSchema = {
    unitPair: [
        [
            Area.UnitMagnitudeScaling,
            Area.UnitFactorScaling,
            Scope.VolumeMeasurement,
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
