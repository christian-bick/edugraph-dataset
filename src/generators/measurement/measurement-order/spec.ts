import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-order',
    generalLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.DirectRelation
    ]
};

export const MeasurementOrderGeneratorSchema = {
    direction: [Scope.AscendingOrder, Scope.DescendingOrder]
} as const;

export type MeasurementOrderGeneratorConfig = ConfigFromSchema<typeof MeasurementOrderGeneratorSchema>;
