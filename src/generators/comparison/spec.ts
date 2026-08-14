import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {resolveComparisonRelation} from './helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'comparison',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
    ]
};


export const ComparisonGeneratorSchema = {
    relation: [
        [
            Area.NumericEquality,
            Area.NumericInequality,
            Scope.Less,
            Scope.Equal,
            Scope.Greater
        ],
        resolveComparisonRelation
    ],
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type ComparisonGeneratorConfig = ConfigFromSchema<typeof ComparisonGeneratorSchema>;
