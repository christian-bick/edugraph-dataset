import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../types/schema.ts';
import { hasLabel } from '../../lib/resolvers.ts';
import { deductCompatible, resolveRangeFromLabels } from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic',
    supportedLabels: [
        Area.BaseOperations,
        Scope.NumericRange,
        Scope.NumericZero,
        Scope.NumericSign,
        Scope.IntegerNumbers
    ]
};

export const ArithmeticGeneralLabels = [
    Scope.IntegerNumbers
];

export const ArithmeticGeneratorSchema = {
    operation: [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ],
    allowNegatives: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        [
            Scope.NumbersSmaller10,
            Scope.NumbersSmaller20,
            Scope.NumbersSmaller100,
            Scope.NumbersSmaller1000,
            Scope.NumbersLarger10,
            Scope.NumbersLarger20,
            Scope.NumbersLarger100,
            Scope.NumbersLarger1000
        ],
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels))
    ]
} as const;

export type ArithmeticGeneratorConfig = ConfigFromSchema<typeof ArithmeticGeneratorSchema>;
