import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRounding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.StepsOf10], [Scope.StepsOf100]]);

const gradeFourBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRounding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.StepsOf10],
        [Scope.StepsOf100],
        [Scope.StepsOf1000],
        [Scope.StepsOf10000],
        [Scope.StepsOf100000]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-integer-rounding', builder),
    ...toTargets('test-integer-rounding-grade-four', gradeFourBuilder)
];
