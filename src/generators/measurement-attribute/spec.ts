import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {extractFirstMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    generalLabels: [
        Area.MeasuringObjects,
    ]
};


export const MeasurementAttributeGeneratorSchema = {
    // TODO: Ontological relations between measurement attributes could be defined
    // to logically constrain compatible dimensions or units, similar to deductCompatible for ranges.
    attribute: [
        [Scope.LengthMeasurement, Scope.WeightMeasurement],
        extractFirstMatch
    ]
} as const;

export type MeasurementAttributeGeneratorConfig = ConfigFromSchema<typeof MeasurementAttributeGeneratorSchema>;
