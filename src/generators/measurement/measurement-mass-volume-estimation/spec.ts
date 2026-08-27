import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const measurementLabelSets = [
    [Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale],
    [Area.MeasuringWeight, Scope.GramScale],
    [Area.MeasuringWeight, Scope.KilogramScale]
] as const;

const resolveMeasurement = selectExactLabelSetMap([
    [measurementLabelSets[0], 'liter-volume'],
    [measurementLabelSets[1], 'gram-weight'],
    [measurementLabelSets[2], 'kilogram-weight']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-volume-estimation',
    generalLabels: [Area.Estimation]
};

export const MeasurementMassVolumeEstimationGeneratorSchema = {
    measurement: [
        [
            Area.MeasuringVolumes,
            Scope.LiquidVolumes,
            Scope.LiterScale,
            Area.MeasuringWeight,
            Scope.GramScale,
            Scope.KilogramScale
        ],
        resolveMeasurement,
        measurementLabelSets
    ]
} as const;

export type MeasurementMassVolumeEstimationGeneratorConfig = ConfigFromSchema<
    typeof MeasurementMassVolumeEstimationGeneratorSchema
>;
