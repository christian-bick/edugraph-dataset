import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Ability.TextualArticulation,
        Scope.NumbersSmaller120
    ]);

const readNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.TextualReception
    ]);

const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller120,
        Ability.Formalization
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-writing', builder),
    ...toTargets('test-reading-numerals', readNumeralsBuilder),
    ...toTargets('test-writing-represent-counts', representCountsBuilder)
];
