import {Ability, Area, Scope} from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';

const measureAnglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleCalculation,
    Scope.DegreeScale,
    Scope.Protractor,
    Ability.ProcedureExecution
]);

const sketchAnglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.ConceptSpecification,
    Ability.VisualArticulation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-measure-angles', measureAnglesBuilder),
    ...toTargets('test-grade4-sketch-angles', sketchAnglesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
