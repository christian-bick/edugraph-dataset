import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const identifyLineSymmetryBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeReflection,
    Scope.Foldable,
    Ability.ConceptClassification,
    Ability.VisualRecognition
]);

const drawLineSymmetryBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeReflection,
    Scope.Foldable,
    Ability.VisualArticulation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-identify-line-symmetry', identifyLineSymmetryBuilder),
    ...toTargets('test-grade4-draw-line-symmetry', drawLineSymmetryBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
