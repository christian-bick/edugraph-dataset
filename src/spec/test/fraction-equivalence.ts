import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.EqualShares,
        Scope.Equal,
        Scope.VisualNumbers,
        Ability.ConceptDerivation
    ]);

const wholeNumberBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Scope.ImproperFractions,
        Scope.IntegerNumbers,
        Scope.Equal,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.ArabicNumerals], [Scope.Numberline]]);

const grade4ScalingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Area.Multiplication,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.VisualNumbers], [Scope.Numberline]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-fraction-equivalence', builder),
    ...toTargets('test-whole-number-fraction', wholeNumberBuilder),
    ...toTargets('test-grade4-fraction-equivalence-scaling', grade4ScalingBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
