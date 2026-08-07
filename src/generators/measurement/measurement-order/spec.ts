import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-order',
    generalLabels: [
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Scope.DirectRelation
    ]
};

export const MeasurementOrderGeneratorSchema = {
    relation: [Scope.Least, Scope.Most]
} as const;

export type MeasurementOrderGeneratorConfig = ConfigFromSchema<typeof MeasurementOrderGeneratorSchema>;
