import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.MultiplesOf100,
        Scope.NumbersWithoutZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller120],
        [Scope.NumbersSmaller1000, Scope.ArabicNumerals, Scope.Base10]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-place-value-hundreds', builder);
