import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-data',
    generalLabels: [
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement
    ]
};

export const MeasurementDataGeneratorSchema = {
    numberKind: [Scope.IntegerNumbers, Scope.FractionNumbers]
} as const;
export type MeasurementDataGeneratorConfig = ConfigFromSchema<typeof MeasurementDataGeneratorSchema>;
