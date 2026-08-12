import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveUnit = (labels: readonly string[]) => labels.includes(Scope.CentimeterScale)
    ? Scope.CentimeterScale
    : labels.includes(Scope.MeterScale)
        ? Scope.MeterScale
        : undefined;

export const spec: GeneratorSpec = {
    generatorId: 'measurement-length-estimation',
    generalLabels: [Area.Estimation, Scope.LengthMeasurement]
};
export const MeasurementLengthEstimationGeneratorSchema = {
    unit: [[Scope.CentimeterScale, Scope.MeterScale], resolveUnit]
} as const;
export type MeasurementLengthEstimationGeneratorConfig = ConfigFromSchema<typeof MeasurementLengthEstimationGeneratorSchema>;
