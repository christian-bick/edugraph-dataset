import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass-volume',
    generalLabels: [
        Area.MeasuringObjects,
        Scope.LiquidVolumes,
        Scope.LiterScale
    ]
};

export const MeasurementMassVolumeGeneratorSchema = {} as const;

export type MeasurementMassVolumeGeneratorConfig = ConfigFromSchema<
    typeof MeasurementMassVolumeGeneratorSchema
>;
