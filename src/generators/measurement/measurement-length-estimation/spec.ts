import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-length-estimation',
    generalLabels: [Area.Estimation, Scope.LengthMeasurement]
};
export const MeasurementLengthEstimationGeneratorSchema = {} as const;
export type MeasurementLengthEstimationGeneratorConfig = ConfigFromSchema<typeof MeasurementLengthEstimationGeneratorSchema>;
