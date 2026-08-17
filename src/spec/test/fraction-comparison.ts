import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const commonDenominatorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Area.FractionNotation,
        Area.FractionNumeratorInterpretation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Scope.CommonDenominator,
        Scope.Greater,
        Ability.ConceptDerivation
    ]);

const commonNumeratorBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Area.FractionNotation,
        Area.FractionDenominatorInterpretation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Scope.CommonNumerator,
        Scope.Less,
        Ability.ConceptDerivation
    ]);

const grade4UnlikeFractionComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Less]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-comparison-common-denominator', commonDenominatorBuilder),
    ...toTargets('test-fraction-comparison-common-numerator', commonNumeratorBuilder),
    ...toTargets('test-grade4-unlike-fraction-comparison', grade4UnlikeFractionComparisonBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
