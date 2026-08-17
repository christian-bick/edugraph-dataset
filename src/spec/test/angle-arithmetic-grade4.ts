import {Ability, Area, Scope} from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';

const additiveAngleMeasureBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AdjacentAngles,
    Area.AngleCalculation,
    Area.Addition,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.ProcedureUnderstanding
]);

const unknownAnglesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdjacentAngles,
        Area.AngleCalculation,
        Scope.AngleMeasurement,
        Scope.DegreeScale
    ])
    .applyLabelVariants([
        [Area.Addition, Ability.ProcedureExecution],
        [Area.Subtraction, Ability.ProcedureInversion]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-additive-angle-measure', additiveAngleMeasureBuilder),
    ...toTargets('test-grade4-unknown-angles', unknownAnglesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
