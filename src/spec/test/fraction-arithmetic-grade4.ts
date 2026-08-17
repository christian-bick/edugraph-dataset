import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const interpretationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.Interpretation
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const decompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Addition,
        Area.Equation,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.ProperFractions],
        [Scope.ImproperFractions, Scope.MixedNumbers]
    ]);

const mixedOperationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Scope.MixedNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const wordProblemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Equation,
        Scope.FractionNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-interpret-fraction-arithmetic', interpretationBuilder),
    ...toTargets('test-grade4-decompose-fractions', decompositionBuilder),
    ...toTargets('test-grade4-mixed-number-arithmetic', mixedOperationBuilder),
    ...toTargets('test-grade4-fraction-word-problems', wordProblemBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
