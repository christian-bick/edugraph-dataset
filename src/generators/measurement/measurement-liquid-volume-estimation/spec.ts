import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-liquid-volume-estimation',
    generalLabels: [Area.Estimation, Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale]
};

export const MeasurementLiquidVolumeEstimationGeneratorSchema = {} as const;
export type MeasurementLiquidVolumeEstimationGeneratorConfig = ConfigFromSchema<typeof MeasurementLiquidVolumeEstimationGeneratorSchema>;
