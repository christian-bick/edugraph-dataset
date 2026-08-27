import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export type OperandDigitProfile =
    | 'one-by-one'
    | 'one-by-two'
    | 'one-by-three'
    | 'one-by-four'
    | 'two-by-two';

const operandDigitProfileFallbacks = [
    [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand],
    [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]
] as const;

const resolveOperandDigitProfile = selectExactLabelSetMap([
    [operandDigitProfileFallbacks[0], 'one-by-one'],
    [operandDigitProfileFallbacks[1], 'one-by-two'],
    [operandDigitProfileFallbacks[2], 'one-by-three'],
    [operandDigitProfileFallbacks[3], 'one-by-four'],
    [operandDigitProfileFallbacks[4], 'two-by-two']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-multiplication',
    generalLabels: [
        Area.MultiplicationPartialProducts,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const MultiDigitMultiplicationGeneratorSchema = {
    operandDigitProfile: [
        [
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitSmallestOperand,
            Scope.SingleDigitLargestOperand,
            Scope.TwoDigitLargestOperand,
            Scope.ThreeDigitLargestOperand,
            Scope.FourDigitLargestOperand
        ],
        resolveOperandDigitProfile,
        operandDigitProfileFallbacks
    ]
} as const;

export type MultiDigitMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitMultiplicationGeneratorSchema
>;
