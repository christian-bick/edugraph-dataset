import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';
import {
    MeasurementConversionPairId,
    MeasurementConversionProblem
} from '../../../types/problems.ts';

type MeasurementConversionTask = Exclude<
    MeasurementConversionProblem['task'],
    'generic-unit-scale'
>;
export type MeasurementConversionUnitPairConfig =
    | MeasurementConversionPairId
    | 'generic-unit-scale';

const resolveTask: ResolverFn<MeasurementConversionTask> = labels => {
    if (labels.includes(Area.UnitScaleRelation)) return 'relative-unit-size';
    if (labels.includes(Scope.ConversionTable)) return 'conversion-table';
    return 'convert-larger-to-smaller';
};

const hasPair = (labels: readonly string[], first: Scope, second: Scope): boolean =>
    labels.includes(first) && labels.includes(second);

const concreteUnitLabels: readonly Scope[] = [
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
    Scope.SecondIntervals
];

const resolveUnitPair: ResolverFn<MeasurementConversionUnitPairConfig | undefined> = labels => {
    if (hasPair(labels, Scope.KilometerScale, Scope.MeterScale)) return 'kilometer-meter';
    if (hasPair(labels, Scope.MeterScale, Scope.CentimeterScale)) return 'meter-centimeter';
    if (hasPair(labels, Scope.KilogramScale, Scope.GramScale)) return 'kilogram-gram';
    if (hasPair(labels, Scope.PoundScale, Scope.OunceScale)) return 'pound-ounce';
    if (hasPair(labels, Scope.LiterScale, Scope.MilliliterScale)) return 'liter-milliliter';
    if (hasPair(labels, Scope.HourIntervals, Scope.MinuteIntervals)) return 'hour-minute';
    if (hasPair(labels, Scope.MinuteIntervals, Scope.SecondIntervals)) return 'minute-second';
    if (labels.includes(Area.UnitScaleRelation)
        && labels.includes(Scope.LengthMeasurement)
        && !labels.includes(Area.UnitMagnitudeScaling)
        && !labels.includes(Area.UnitFactorScaling)
        && !concreteUnitLabels.some(label => labels.includes(label))) {
        return 'generic-unit-scale';
    }
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'measurement-conversion',
    generalLabels: []
};

export const MeasurementConversionGeneratorSchema = {
    task: [
        [Area.UnitScaleRelation, Scope.ConversionTable],
        resolveTask
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
        resolveUnitPair
    ]
} as const;

export type MeasurementConversionGeneratorConfig = ConfigFromSchema<
    typeof MeasurementConversionGeneratorSchema
>;
