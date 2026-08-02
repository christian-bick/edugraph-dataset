import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-arithmetic-equation-judgment', builder);
