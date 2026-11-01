import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-multiplication-model',
    generalLabels: [
        Area.Multiplication,
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

export const DecimalMultiplicationModelGeneratorSchema = {
    range: [[Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100,
        Scope.NumbersSmaller120, Scope.NumbersSmaller1000, Scope.NumbersSmaller10000], selectExactLabelMap([
        [Scope.NumbersSmaller5, createCanonicalNumericRange(5)], [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
        [Scope.NumbersSmaller20, createCanonicalNumericRange(20)], [Scope.NumbersSmaller100, createCanonicalNumericRange(100)],
        [Scope.NumbersSmaller120, createCanonicalNumericRange(120)], [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)],
        [Scope.NumbersSmaller10000, createCanonicalNumericRange(10000)]
    ] as const)]
} as const;

export type DecimalMultiplicationModelGeneratorConfig = ConfigFromSchema<
    typeof DecimalMultiplicationModelGeneratorSchema
>;
