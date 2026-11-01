import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'percent-quantity-relations',
    generalLabels: [
        Area.PercentageRateApplication, Area.PercentageEquivalence, Area.ProportionalScaling,
        Scope.RationalNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero
    ]
};

export const PercentQuantityRelationsGeneratorSchema = {
    range: [[Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000, Scope.NumbersSmaller10000],
        selectExactLabelMap([
            [Scope.NumbersSmaller100, createCanonicalNumericRange(100)],
            [Scope.NumbersSmaller120, createCanonicalNumericRange(120)],
            [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)],
            [Scope.NumbersSmaller10000, createCanonicalNumericRange(10000)]
        ] as const)]
} as const;

export type PercentQuantityRelationsGeneratorConfig = ConfigFromSchema<typeof PercentQuantityRelationsGeneratorSchema>;
