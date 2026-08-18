import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Ability.VisualArticulation,
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

const gradeTwoNumeralBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger120,
        Scope.NumbersSmaller1000
    ])
    .applyLabelVariants([
        [Ability.TextualReception],
        [Ability.VisualArticulation]
    ]);

const numberNameBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumberNameNotation,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Ability.TextualArticulation
    ]);

const gradeFourNumeralBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000
    ])
    .applyLabelVariants([
        [Ability.TextualReception],
        [Ability.VisualArticulation]
    ]);

const gradeFourNumberNameBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumberNameNotation,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000,
        Ability.TextualArticulation
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-writing', builder),
    ...toTargets('test-reading-numerals', readNumeralsBuilder),
    ...toTargets('test-writing-represent-counts', representCountsBuilder),
    ...toTargets('test-writing-grade-two-numerals', gradeTwoNumeralBuilder),
    ...toTargets('test-writing-number-name', numberNameBuilder),
    ...toTargets('test-writing-grade-four-numerals', gradeFourNumeralBuilder),
    ...toTargets('test-writing-grade-four-number-name', gradeFourNumberNameBuilder)
];
