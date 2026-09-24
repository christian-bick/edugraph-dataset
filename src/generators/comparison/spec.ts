import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {resolveComparisonRelation} from './helpers.ts';

import {generatorLabelRule} from '../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'comparison',
    compatibility: [generatorLabelRule('equal-zero-negative-domain', [
        Scope.Equal, Scope.NumbersWithZero, Scope.NumbersWithNegatives
    ], selected => !selected(Scope.Equal)
        || !selected(Scope.NumbersWithZero) || !selected(Scope.NumbersWithNegatives))],
    generalLabels: [
        Scope.IntegerNumbers
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
        resolveComparisonRelation,
        [
            [Area.NumericEquality, Scope.Equal],
            [Area.NumericInequality, Scope.Less],
            [Area.NumericInequality, Scope.Greater]
        ]
    ],
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives),
        [[Scope.NumbersWithNegatives], [Scope.NumbersWithoutNegatives]]
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ComparisonGeneratorConfig = ConfigFromSchema<typeof ComparisonGeneratorSchema>;
