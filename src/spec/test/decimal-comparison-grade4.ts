import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const comparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithDecimals,
        Area.DecimalNotation,
        Area.DecimalPrecission,
        Scope.DecimalNumbers,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Less]
    ]);

export const spec: CompetencyTarget[] = toTargets(
    'test-grade4-decimal-comparison',
    comparisonBuilder
);
export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
