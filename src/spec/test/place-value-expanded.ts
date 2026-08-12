import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.Sum,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.TwoOperands],
        [Scope.ThreeOperands]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-place-value-expanded', builder);
