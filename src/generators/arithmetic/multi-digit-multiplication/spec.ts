import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

export type OperandDigitProfile =
    | 'one-by-one'
    | 'one-by-two'
    | 'one-by-three'
    | 'one-by-four'
    | 'two-by-two';

const resolveOperandDigitProfile: ResolverFn<OperandDigitProfile | undefined> = labels => {
    const hasSingleDigitSmallest = labels.includes(Scope.SingleDigitSmallestOperand);
    const hasTwoDigitSmallest = labels.includes(Scope.TwoDigitSmallestOperand);

    if (hasTwoDigitSmallest && labels.includes(Scope.TwoDigitLargestOperand)) {
        return 'two-by-two';
    }
    if (!hasSingleDigitSmallest) return undefined;
    if (labels.includes(Scope.FourDigitLargestOperand)) return 'one-by-four';
    if (labels.includes(Scope.ThreeDigitLargestOperand)) return 'one-by-three';
    if (labels.includes(Scope.TwoDigitLargestOperand)) return 'one-by-two';
    if (labels.includes(Scope.SingleDigitLargestOperand)) return 'one-by-one';
    return undefined;
};

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-multiplication',
    generalLabels: [
        Area.Multiplication,
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
        resolveOperandDigitProfile
    ]
} as const;

export type MultiDigitMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitMultiplicationGeneratorSchema
>;
