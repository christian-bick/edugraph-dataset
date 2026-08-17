import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.MultiStep,
        Scope.MultiLevelComposition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division],
        [Area.Addition, Area.Subtraction],
        [Area.Addition, Area.Multiplication],
        [Area.Addition, Area.Division],
        [Area.Subtraction, Area.Multiplication],
        [Area.Subtraction, Area.Division],
        [Area.Multiplication, Area.Division]
    ]);

const interpretedRemainderBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.ImperfectDivisibility,
    Area.Modulo,
    Scope.MultiStep,
    Ability.TextualReception,
    Ability.ResultInterpretation
]);

const letterEquationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Addition,
    Area.Multiplication,
    Area.Equation,
    Scope.MultiStep,
    Scope.MultiLevelComposition,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero,
    Scope.NumbersSmaller1000000,
    Ability.TextualReception,
    Ability.Formalization
]);

const reasonablenessBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.Estimation,
    Area.IntegerRounding,
    Scope.MultiStep,
    Scope.NumbersSmaller1000000,
    Ability.TextualReception,
    Ability.ResultInterpretation,
    Ability.ProcedureUnderstanding
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-arithmetic-word-problems-two-step', builder),
    ...toTargets('test-interpreted-remainder', interpretedRemainderBuilder),
    ...toTargets('test-multistep-letter-equation', letterEquationBuilder),
    ...toTargets('test-multistep-reasonableness', reasonablenessBuilder)
];
