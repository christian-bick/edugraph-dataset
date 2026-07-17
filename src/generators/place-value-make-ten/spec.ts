import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-make-ten',
    supportedLabels: [
        Area.BaseOperations,
        Scope.Base10,
        Scope.NumbersSmaller10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithNegatives,
    ]
};

export const PlaceValueMakeTenGeneralLabels = [
    Area.BaseOperations,
    Scope.Base10,
    Scope.NumbersSmaller10,
    Scope.NumbersWithoutZero,
    Scope.NumbersWithZero,
    Scope.NumbersWithNegatives
];

export const PlaceValueMakeTenGeneratorSchema = {
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ]
    // TODO: deductive capabilities for range properties like deductCompatible could be beneficial here in the future
} as const;

export type PlaceValueMakeTenGeneratorConfig = ConfigFromSchema<typeof PlaceValueMakeTenGeneratorSchema>;
