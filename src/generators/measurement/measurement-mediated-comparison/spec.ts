import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mediated-comparison',
    generalLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.MediatedRelation
    ]
};

export const MeasurementMediatedComparisonGeneratorSchema = {
    relation: [Scope.Greater, Scope.Less]
} as const;

export type MeasurementMediatedComparisonGeneratorConfig =
    ConfigFromSchema<typeof MeasurementMediatedComparisonGeneratorSchema>;
