import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'ordering',
    supportedLabels: [
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithNegatives,
    ],
};

export const OrderingGeneralLabels = [
    Area.NumerationWithIntegers,
    Scope.Base10
];

export const OrderingGeneratorSchema = {
    // TODO: implement logical constraints relations on this property to make use of deductCompatible
    allowNegatives: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    // TODO: implement logical constraints relations on this property to make use of deductCompatible
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as any))
    ]
} as const;

export type OrderingGeneratorConfig = ConfigFromSchema<typeof OrderingGeneratorSchema>;
