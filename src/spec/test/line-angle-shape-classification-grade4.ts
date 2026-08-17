import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

const classifyByLineRelationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.ParallelismRelation],
        [Area.PerpendicularityRelation]
    ]);

const classifyByAngleSizeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.RightAngle],
        [Area.AcuteAngle],
        [Area.ObtuseAngle]
    ]);

const recognizeRightTrianglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeSubsumption,
    Area.RightTriangle,
    Area.RightAngle,
    Scope.ShapeAttributes,
    Ability.ConceptClassification,
    Ability.VisualRecognition
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-grade4-classify-line-relations', classifyByLineRelationsBuilder),
    ...toTargets('test-grade4-classify-angle-size', classifyByAngleSizeBuilder),
    ...toTargets('test-grade4-right-triangle-category', recognizeRightTrianglesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];
export const ontologyTodos: OntologyTodo[] = [];
export const beyondScope: BeyondScopeEntry[] = [];
export const equivalentTargets: TargetEquivalence[] = [];
