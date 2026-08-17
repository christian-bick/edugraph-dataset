import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const equationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.ProportionalScaling,
    Area.Equation,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Ability.Interpretation
]);

const wordProblemBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.ProportionalScaling,
    Scope.SingleStep,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero,
    Ability.TextualReception
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-multiplicative-comparison-equation', equationBuilder),
    ...toTargets('test-multiplicative-comparison-word-problem', wordProblemBuilder)
];
