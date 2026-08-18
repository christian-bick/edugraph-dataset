import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const standardAlgorithmAddSubtractBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.AdditionStandardAlgorithm],
        [Area.SubtractionStandardAlgorithm]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-standard-algorithm-add-subtract', standardAlgorithmAddSubtractBuilder)
];
