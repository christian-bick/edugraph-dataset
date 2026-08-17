import {Ability, Area} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const drawingVariants = [
    [Area.PointConcept],
    [Area.LinearDrawing, Area.LineConcept],
    [Area.LinearDrawing, Area.LineSegment],
    [Area.LinearDrawing, Area.RayConcept],
    [Area.LinearDrawing, Area.RightAngle],
    [Area.LinearDrawing, Area.AcuteAngle],
    [Area.LinearDrawing, Area.ObtuseAngle],
    [Area.LinearDrawing, Area.PerpendicularityRelation],
    [Area.LinearDrawing, Area.ParallelismRelation]
];

const primitiveVariants = [
    [Area.PointConcept],
    [Area.LineConcept],
    [Area.LineSegment],
    [Area.RayConcept],
    [Area.RightAngle],
    [Area.AcuteAngle],
    [Area.ObtuseAngle],
    [Area.PerpendicularityRelation],
    [Area.ParallelismRelation]
];

const drawGeometricPrimitivesBuilder = new DatasetPermutationBuilder()
    .addLabels([Ability.VisualArticulation])
    .applyLabelVariants(drawingVariants);

const identifyGeometricPrimitivesBuilder = new DatasetPermutationBuilder()
    .addLabels([Ability.VisualRecognition])
    .applyLabelVariants(primitiveVariants);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-draw-geometric-primitives', drawGeometricPrimitivesBuilder),
    ...toTargets('test-grade4-identify-geometric-primitives', identifyGeometricPrimitivesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
