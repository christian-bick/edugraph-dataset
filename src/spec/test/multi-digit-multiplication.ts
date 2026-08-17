import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const multiDigitMultiplicationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand],
        [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-multi-digit-multiplication', multiDigitMultiplicationBuilder)
];
