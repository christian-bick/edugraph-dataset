import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-decimal-division',
    generalLabels: [
        Area.DivisionStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand,
        Scope.TwoOperands,
        Scope.NumbersWithZero
    ]
};

export const StandardAlgorithmDecimalDivisionGeneratorSchema = {
    range: [[Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100,
        Scope.NumbersSmaller120, Scope.NumbersSmaller1000, Scope.NumbersSmaller10000,
        Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000], selectExactLabelMap([
        [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
        [Scope.NumbersSmaller20, createCanonicalNumericRange(20)],
        [Scope.NumbersSmaller100, createCanonicalNumericRange(100)],
        [Scope.NumbersSmaller120, createCanonicalNumericRange(120)],
        [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)],
        [Scope.NumbersSmaller10000, createCanonicalNumericRange(10000)],
        [Scope.NumbersSmaller100000, createCanonicalNumericRange(100000)],
        [Scope.NumbersSmaller1000000, createCanonicalNumericRange(1000000)]
    ] as const)]
} as const;

export type StandardAlgorithmDecimalDivisionGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmDecimalDivisionGeneratorSchema
>;
