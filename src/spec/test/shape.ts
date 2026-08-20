import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

const builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeAttributes,
        Scope.GeometrySticks,
        Area.ShapeIdentity,
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
        Area.ShapeClassification,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Circle, Scope.TwoDimensional],
        [Area.Square, Scope.TwoDimensional],
        [Area.Triangle, Scope.TwoDimensional],
        [Area.Sphere, Scope.ThreeDimensional],
        [Area.Cube, Scope.ThreeDimensional],
        [Area.Cone, Scope.ThreeDimensional]
    ]);

const classifyAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ]);

const classifyAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.AngleCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

const specifyAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.AngleCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

const specifyShapeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation,
        Area.Triangle
    ]);

const drawFromAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation,
        Area.Circle,
        Area.CircularShapeDrawing
    ]);

const compareAttrBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeAttributes,
        Area.ShapeIdentity,
        Area.NumericComparison,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon],
        [Area.Circle],
        [Area.Cube],
        [Area.Cone],
        [Area.Cylinder],
        [Area.Sphere]
    ]);

const singleLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.SingleLevelComposition,
        Ability.ConceptComposition,
        Area.Rectangle
    ]);

const multiLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.MultiLevelComposition,
        Ability.ConceptComposition,
        Area.Cube
    ]);

const envShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeNaming,
        Scope.PhysicalGeometry,
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
        Area.ShapeNaming,
        Scope.ShapeSizeVariation,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle, Scope.ShapeOrientationVariation],
        [Area.Square, Scope.ShapeOrientationVariation],
        [Area.Rectangle, Scope.ShapeOrientationVariation],
        [Area.Circle],
        [Area.Hexagon, Scope.ShapeOrientationVariation],
        [Area.Cube, Scope.ShapeOrientationVariation],
        [Area.Sphere],
        [Area.Cone, Scope.ShapeOrientationVariation],
        [Area.Cylinder, Scope.ShapeOrientationVariation]
    ]);

const extendedIdentityNamingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeNaming,
        Scope.ShapeAttributes,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Quadrilateral],
        [Area.Pentagon]
    ]);

const quadrilateralHierarchyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Scope.ShapeAttributes,
        Ability.ConceptClassification,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([[Area.Rhombus], [Area.Rectangle], [Area.Square]]);

const identityDrawBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRotationConservation,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

const otherQuadrilateralDrawingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Quadrilateral,
        Area.ShapeSubsumption,
        Area.LinearShapeDrawing,
        Scope.ShapeAttributes,
        Ability.VisualArticulation
    ]);

const identityPositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SpatialPosition,
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
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Sphere, Scope.Rollable],
        [Area.Cube, Scope.Stackable],
        [Area.Rectangle, Scope.Foldable]
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
    ...toTargets('test-quadrilateral-hierarchy', quadrilateralHierarchyBuilder),
    ...toTargets('test-shape-identity-draw', identityDrawBuilder),
    ...toTargets('test-other-quadrilateral-drawing', otherQuadrilateralDrawingBuilder),
    ...toTargets('test-shape-identity-position', identityPositionBuilder),
    ...toTargets('test-shape-same-attribute', sameAttributeBuilder)
];
