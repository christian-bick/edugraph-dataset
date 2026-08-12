import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .applyLabelVariants([
        [Ability.ProcedureInversion],
        [Ability.ProcedureExecution]
    ])
    .addLabels([Scope.NumbersSmaller10]);

const multiplesOfTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Subtraction,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ]);

const wordProblemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const unknownAddendBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const lengthWordProblemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.LengthMeasurement,
        Scope.TwoOperands,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const equalAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Equation,
        Area.IteratedOperation,
        Scope.EvenNumbers,
        Scope.ExpressionOnOneSide,
        Scope.TwoOperands,
        Scope.NumbersSmaller20,
        Ability.Formalization
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-arithmetic-ops-pairs', builder),
    ...toTargets('test-arithmetic-multiples-of-ten', multiplesOfTenBuilder),
    ...toTargets('test-arithmetic-word-problems', wordProblemBuilder),
    ...toTargets('test-arithmetic-unknown-addend', unknownAddendBuilder),
    ...toTargets('test-length-word-problems', lengthWordProblemBuilder),
    ...toTargets('test-arithmetic-equal-addends', equalAddendsBuilder)
];
