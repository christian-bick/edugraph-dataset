import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Ability.ProcedureExecution,
        Scope.NumbersSmaller10
    ]);

export const spec: CompetencyTarget[] = toTargets('test-writing', builder);

const writeTo120Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ]);

const representTo120Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ]);

spec.push(
    ...toTargets('test-writing-to-120', writeTo120Builder),
    ...toTargets('test-represent-to-120', representTo120Builder)
);
