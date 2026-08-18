import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.AdditionCompensation],
        [Area.SubtractionCompensation],
        [Area.SubtractionThinkAddition]
    ]);

export const spec: CompetencyTarget[] = toTargets(
    'test-integer-add-subtract-strategies',
    builder
);
