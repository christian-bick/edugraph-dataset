import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Greater]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .addLabels([Scope.NumbersSmaller10]);

const gradeFourBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Less],
        [Scope.Equal],
        [Scope.Greater]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-comparison', builder),
    ...toTargets('test-comparison-grade-four', gradeFourBuilder)
];
