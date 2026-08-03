import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const teenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Sum,
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller20
    ]);

const multipleTensBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-place-value-teen', teenBuilder),
    ...toTargets('test-place-value-multiple-tens', multipleTensBuilder)
];
