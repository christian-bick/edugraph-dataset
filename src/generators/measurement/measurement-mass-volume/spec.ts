import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-volume',
    generalLabels: [Area.MeasuringObjects]
};

export const MeasurementMassVolumeGeneratorSchema = {
    measurement: [Scope.LiquidVolumes, Scope.WeightMeasurement],
    scale: [Scope.LiterScale, Scope.GramScale, Scope.KilogramScale]
} as const;

export type MeasurementMassVolumeGeneratorConfig = ConfigFromSchema<
    typeof MeasurementMassVolumeGeneratorSchema
>;
