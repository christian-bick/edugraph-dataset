import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-make-ten',
    supportedLabels: [
        Area.Difference,
        Scope.Base10,
        Scope.NumbersLargerZero,
        Scope.NumbersSmaller10,
        Scope.NumbersWithoutNegatives,
        Scope.IntegerNumbers
    ]
};


export const PlaceValueMakeTenGeneratorSchema = {
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ]
} as const;

export type PlaceValueMakeTenGeneratorConfig = ConfigFromSchema<typeof PlaceValueMakeTenGeneratorSchema>;
