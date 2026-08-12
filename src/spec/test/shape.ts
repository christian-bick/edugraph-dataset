import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeProperties,
        Area.ShapeRecognition,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon]
    ]);

const classifyDimBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeProperties,
        Area.ShapeRecognition,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Triangle],
        [Area.Sphere],
        [Area.Cube],
        [Area.Cone]
    ]);

const classifyAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ]);

const classifyAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

const specifyAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

const specifyShapeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation,
        Area.Triangle
    ]);

const drawFromAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation,
        Area.Circle,
        Area.CircularShapeDrawing
    ]);

const compareAttrBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeProperties,
        Area.ShapeRecognition,
        Area.NumericComparison,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon],
        [Area.Circle]
    ]);

const singleLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Scope.SingleLevelComposition,
        Ability.ConceptComposition,
        Area.Rectangle
    ]);

const multiLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Scope.MultiLevelComposition,
        Ability.ConceptComposition,
        Area.Cube
    ]);

const envShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Triangle],
        [Area.Hexagon]
    ]);

const identityNamingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Circle],
        [Area.Hexagon],
        [Area.Cube],
        [Area.Sphere],
        [Area.Cone],
        [Area.Cylinder]
    ]);

const extendedIdentityNamingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Scope.ShapeAttributes,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Quadrilateral],
        [Area.Pentagon]
    ]);

const identityDrawBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

const identityPositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SpatialModelling,
        Ability.SpatialInterpretation
    ])
    .applyLabelVariants([
        [Scope.Above],
        [Scope.Below],
        [Scope.Beside],
        [Scope.Behind],
        [Scope.Ahead]
    ]);

const sameAttributeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ObjectSorting,
        Ability.ConceptClassification,
        Scope.ShapeProperties
    ])
    .applyLabelVariants([
        [Area.Sphere],
        [Area.Cube],
        [Area.Rectangle]
    ]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-build-shape', builder),
    ...toTargets('test-shape-classify-dim', classifyDimBuilder),
    ...toTargets('test-shape-classify-attributes', classifyAttributesBuilder),
    ...toTargets('test-shape-classify-attribute-counts', classifyAttributeCountsBuilder),
    ...toTargets('test-shape-specify-attribute-counts', specifyAttributeCountsBuilder),
    ...toTargets('test-shape-specify-attributes', specifyShapeBuilder),
    ...toTargets('test-shape-draw-from-attributes', drawFromAttributesBuilder),
    ...toTargets('test-shape-compare-attributes', compareAttrBuilder),
    ...toTargets('test-shape-compose-single-level', singleLevelCompositionBuilder),
    ...toTargets('test-shape-compose-multi-level', multiLevelCompositionBuilder),
    ...toTargets('test-shape-env-shapes', envShapesBuilder),
    ...toTargets('test-shape-identity-naming', identityNamingBuilder),
    ...toTargets('test-shape-identity-naming-extended', extendedIdentityNamingBuilder),
    ...toTargets('test-shape-identity-draw', identityDrawBuilder),
    ...toTargets('test-shape-identity-position', identityPositionBuilder),
    ...toTargets('test-shape-same-attribute', sameAttributeBuilder)
];
