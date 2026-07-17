import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement',
    supportedLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};

export const MeasurementGeneralLabels = [
    Area.Measurement,
    Scope.LengthMeasurement,
    Scope.NumericRange,
    Scope.NumericZero
];

export const MeasurementGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
    // TODO: Add ontological relations for other properties like units or dimension when available
} as const;

export type MeasurementGeneratorConfig = ConfigFromSchema<typeof MeasurementGeneratorSchema>;
