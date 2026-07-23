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

const compareAttrBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ShapeProperties,
        Area.ShapeRecognition,
        Area.NumericComparison,
        Ability.VisualDecomposition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon],
        [Area.Circle]
    ]);

// TODO: The shape-compose-shapes generator only supports rectangle and square as
// composition targets (built from triangles); a [Area.Triangle] variant is not
// supported.
const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square]
    ]);

const envShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Rectangle]
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

const identityDrawBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Area.ShapePlotting,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Triangle]
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
        [Scope.Behind]
    ]);

const sameAttributeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ObjectSorting,
        Ability.InductiveReasoning,
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
    ...toTargets('test-shape-compare-attributes', compareAttrBuilder),
    ...toTargets('test-shape-compose-shapes', composeShapesBuilder),
    ...toTargets('test-shape-env-shapes', envShapesBuilder),
    ...toTargets('test-shape-identity-naming', identityNamingBuilder),
    ...toTargets('test-shape-identity-draw', identityDrawBuilder),
    ...toTargets('test-shape-identity-position', identityPositionBuilder),
    ...toTargets('test-shape-same-attribute', sameAttributeBuilder)
];
