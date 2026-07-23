import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope, deductCompatible} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-make-ten',
    generalLabels: [
        Area.Difference,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.IntegerNumbers
    ]
};


export const PlaceValueMakeTenGeneratorSchema = {
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueMakeTenGeneratorConfig = ConfigFromSchema<typeof PlaceValueMakeTenGeneratorSchema>;
