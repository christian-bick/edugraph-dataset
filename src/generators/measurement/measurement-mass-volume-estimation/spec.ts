import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-volume-estimation',
    generalLabels: [Area.Estimation, Scope.LiquidVolumes, Scope.LiterScale]
};

export const MeasurementMassVolumeEstimationGeneratorSchema = {} as const;

export type MeasurementMassVolumeEstimationGeneratorConfig = ConfigFromSchema<
    typeof MeasurementMassVolumeEstimationGeneratorSchema
>;
