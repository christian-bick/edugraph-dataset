import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    generalLabels: [
        Area.MeasuringObjects,
    ]
};


export const MeasurementAttributeGeneratorSchema = {
    attribute: [
        [Scope.LengthMeasurement, Scope.WeightMeasurement],
        selectExactMatch
    ]
} as const;

export type MeasurementAttributeGeneratorConfig = ConfigFromSchema<typeof MeasurementAttributeGeneratorSchema>;
