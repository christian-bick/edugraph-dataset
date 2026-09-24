import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-liquid-volume',
    generalLabels: [Area.MeasuringVolumes, Scope.LiquidVolumes, Scope.LiterScale]
};

export const MeasurementLiquidVolumeGeneratorSchema = {} as const;
export type MeasurementLiquidVolumeGeneratorConfig = ConfigFromSchema<typeof MeasurementLiquidVolumeGeneratorSchema>;
