import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

type MeasurementMassVolumeKind = 'liter-volume' | 'gram-weight' | 'kilogram-weight';

const resolveMeasurement: ResolverFn<MeasurementMassVolumeKind | undefined> = labels => {
    if (labels.includes(Scope.LiterScale)) return 'liter-volume';
    if (labels.includes(Scope.GramScale)) return 'gram-weight';
    if (labels.includes(Scope.KilogramScale)) return 'kilogram-weight';
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-volume',
    generalLabels: []
};

export const MeasurementMassVolumeGeneratorSchema = {
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
        [
            [Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale],
            [Area.MeasuringWeight, Scope.GramScale],
            [Area.MeasuringWeight, Scope.KilogramScale]
        ]
    ]
} as const;

export type MeasurementMassVolumeGeneratorConfig = ConfigFromSchema<
    typeof MeasurementMassVolumeGeneratorSchema
>;
