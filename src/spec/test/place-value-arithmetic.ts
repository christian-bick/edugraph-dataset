import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const concreteBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const methodBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const explanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.TextualArticulation,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const grade1AdditionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdditionPlaceValuePartitioning,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, Area.IntegerRegrouping],
        [Scope.MultiplesOf10, Scope.TwoDigitLargestOperand]
    ]);

const grade1SubtractionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SubtractionPlaceValuePartitioning,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.MultiplesOf10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero],
        [Scope.NumbersWithZero]
    ]);

const grade1AdditionExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdditionPlaceValuePartitioning,
        Scope.TwoOperands,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, Area.IntegerRegrouping],
        [Scope.MultiplesOf10, Scope.TwoDigitLargestOperand]
    ]);

const grade1SubtractionExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SubtractionPlaceValuePartitioning,
        Scope.TwoOperands,
        Scope.MultiplesOf10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero],
        [Scope.NumbersWithZero]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-place-value-regrouping', concreteBuilder),
    ...toTargets('test-place-value-written-method', methodBuilder),
    ...toTargets('test-place-value-strategy-explanation', explanationBuilder),
    ...toTargets('test-grade1-place-value-addition', grade1AdditionBuilder),
    ...toTargets('test-grade1-place-value-subtraction', grade1SubtractionBuilder),
    ...toTargets('test-grade1-place-value-addition-explanation', grade1AdditionExplanationBuilder),
    ...toTargets('test-grade1-place-value-subtraction-explanation', grade1SubtractionExplanationBuilder)
];
