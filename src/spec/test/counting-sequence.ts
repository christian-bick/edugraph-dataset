import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.After,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.StepsOf1],
        [Scope.StepsOf5],
        [Scope.StepsOf10],
        [Scope.StepsOf100]
    ]);

export const spec: CompetencyTarget[] = toTargets('test-counting-sequence-to-1000', builder);
