import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ordering',
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.IntegerNumbers
    ],
};


export const OrderingGeneratorSchema = {
    allowNegatives: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type OrderingGeneratorConfig = ConfigFromSchema<typeof OrderingGeneratorSchema>;
