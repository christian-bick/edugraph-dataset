import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {extractFirstMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange
    ]
};


export const MeasurementAttributeGeneratorSchema = {
    // TODO: Ontological relations between measurement attributes could be defined
    // to logically constrain compatible dimensions or units, similar to deductCompatible for ranges.
    attribute: [
        [Scope.LengthMeasurement, Scope.WeightMeasurement],
        extractFirstMatch([Scope.LengthMeasurement, Scope.WeightMeasurement])
    ]
} as const;

export type MeasurementAttributeGeneratorConfig = ConfigFromSchema<typeof MeasurementAttributeGeneratorSchema>;
