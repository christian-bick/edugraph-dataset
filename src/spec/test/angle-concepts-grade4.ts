import {Ability, Area, Scope} from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';
import DatasetPermutationBuilder, {
    toTargets
} from '../../lib/dataset-permutation-builder.ts';

const recognizeAngleArcBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.RayConcept,
    Area.ArchConcept,
    Area.Circle,
    Area.FractionInterpretation,
    Scope.AngleMeasurement,
    Ability.Interpretation
]);

const deriveOneDegreeBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.Circle,
    Area.FractionInterpretation,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Scope.UnitFractions,
    Ability.ConceptDerivation
]);

const interpretDegreeIterationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.AngleCalculation,
    Area.Iteration,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.Interpretation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-angle-from-arc', recognizeAngleArcBuilder),
    ...toTargets('test-grade4-one-degree-turn', deriveOneDegreeBuilder),
    ...toTargets('test-grade4-iterate-degrees', interpretDegreeIterationBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
