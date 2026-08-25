import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    generalLabels: []
};


export const MeasurementAttributeGeneratorSchema = {
    attribute: [
        [Area.MeasuringLength, Area.MeasuringWeight],
        selectExactMatch
    ]
} as const;

export type MeasurementAttributeGeneratorConfig = ConfigFromSchema<typeof MeasurementAttributeGeneratorSchema>;
