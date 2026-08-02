import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericOrder,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithNegatives],
        [Scope.NumbersWithoutNegatives]
    ])
    .applyLabelVariants([
        [Scope.Most],
        [Scope.Least]
    ])
    .addLabels([Scope.NumbersSmaller100]);

export const spec: CompetencyTarget[] = toTargets('test-ordering', builder);

const gradeOneBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericOrder,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Scope.Least,
        Ability.ProcedureExecution
    ]);

spec.push(...toTargets('test-ordering-to-120', gradeOneBuilder));
