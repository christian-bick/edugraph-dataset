import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-decimal-multiplication',
    generalLabels: [
        Area.MultiplicationStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand,
        Scope.TwoOperands,
        // The prescribed first coefficient pass has place-shift count zero;
        // the consumer explicitly prints “shift 0” in every worked solution.
        Scope.NumbersWithZero
    ]
};

export const StandardAlgorithmDecimalMultiplicationGeneratorSchema = {
    range: [[Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000,
        Scope.NumbersSmaller10000, Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000], selectExactLabelMap([
        [Scope.NumbersSmaller100, createCanonicalNumericRange(100)],
        [Scope.NumbersSmaller120, createCanonicalNumericRange(120)],
        [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)],
        [Scope.NumbersSmaller10000, createCanonicalNumericRange(10000)],
        [Scope.NumbersSmaller100000, createCanonicalNumericRange(100000)],
        [Scope.NumbersSmaller1000000, createCanonicalNumericRange(1000000)]
    ] as const)]
} as const;

export type StandardAlgorithmDecimalMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmDecimalMultiplicationGeneratorSchema
>;
