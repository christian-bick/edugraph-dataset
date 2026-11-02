import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectExactLabelMap([
    [Area.AdditionStandardAlgorithm, 'addition'],
    [Area.SubtractionStandardAlgorithm, 'subtraction']
] as const);

const upperBounds = [
    [Scope.NumbersSmaller1000, createCanonicalNumericRange(1000)],
    [Scope.NumbersSmaller10000, createCanonicalNumericRange(10000)],
    [Scope.NumbersSmaller100000, createCanonicalNumericRange(100000)],
    [Scope.NumbersSmaller1000000, createCanonicalNumericRange(1000000)]
] as const;
const resolveRange = selectExactLabelMap(upperBounds);

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-add-subtract',
    generalLabels: [
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.MultipleDigitSmallestOperand,
        Scope.MultipleDigitLargestOperand
    ]
};

export const StandardAlgorithmAddSubtractGeneratorSchema = {
    operation: [
        [Area.AdditionStandardAlgorithm, Area.SubtractionStandardAlgorithm],
        resolveOperation
    ],
    range: [
        upperBounds.map(([label]) => label),
        resolveRange
    ]
} as const;

export type StandardAlgorithmAddSubtractGeneratorConfig = ConfigFromSchema<
    typeof StandardAlgorithmAddSubtractGeneratorSchema
>;
