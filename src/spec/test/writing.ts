import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Ability.TextualArticulation,
        Scope.NumbersSmaller10
    ]);

const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.Formalization
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-writing', builder),
    ...toTargets('test-writing-represent-counts', representCountsBuilder)
];
