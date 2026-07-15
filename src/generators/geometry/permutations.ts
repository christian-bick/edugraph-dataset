
import { DatasetGenerationConfig } from "../../types/ml-engine.ts";
import DatasetPermutationBuilder from "../../lib/dataset-permutation-builder.ts";
import { Area, Scope, Ability } from "edugraph-ts";

const SEED = 42;

function buildPermutations() {
    // 1. K.G.A.1 Positions
    const positions = new DatasetPermutationBuilder()
        .addLabels([Area.PositionalRelations, Area.GeometricRelations, Scope.VisualGeometry, Ability.ConceptSpecification])
        .addConstraints({ mode: 'position' })
        .applyConstraintVariants('relation', ['above', 'below', 'beside', 'nextTo'])
        .build();

    // 2. K.G.A.1 Environmental shapes
    const envShapes = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Area.PositionalRelations, Scope.VisualGeometry, Ability.ConceptSpecification])
        .addConstraints({ mode: 'env-shapes' })
        .applyConstraintVariants('target', ['clock', 'window', 'table'])
        .build();

    // 3. K.G.A.2 Name 2D shapes
    const name2D = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Area.ShapeIdentity, Area.ShapeRotation, Area.ShapeResizing, Scope.VisualGeometry, Ability.VisualRecognition])
        .addConstraints({ mode: 'name-2d' })
        .applyConstraintVariants('shape', ['square', 'circle', 'triangle', 'rectangle', 'hexagon'])
        .build();

    // 4. K.G.A.2 Name 3D shapes
    const name3D = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Area.ShapeIdentity, Area.ShapeRotation, Area.ShapeResizing, Scope.VisualGeometry, Ability.VisualRecognition])
        .addConstraints({ mode: 'name-3d' })
        .applyConstraintVariants('shape', ['cube', 'cone', 'cylinder', 'sphere'])
        .build();

    // 5. K.G.A.3 Flat vs Solid
    const classifyDim = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Scope.TwoDimensional, Scope.ThreeDimensional, Scope.VisualGeometry, Ability.ConceptClassification])
        .addConstraints({ mode: 'classify-dim' })
        .applyConstraintVariants('shapeType', ['2d', '3d'])
        .build();

    // 6. K.G.B.4 Compare attributes (sides/corners)
    const compareAttrs = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Area.ShapeEquivalenceRelations, Area.GeometricRelations, Scope.TwoDimensional, Ability.ConceptSpecification])
        .addConstraints({ mode: 'compare-attributes', shape1: 'rectangle', shape2: 'triangle' })
        .applyConstraintVariants('attribute', ['sides', 'corners'])
        .build();

    // 7. K.G.B.4 Same attributes (roll/stack/flat)
    const sameAttr = new DatasetPermutationBuilder()
        .addLabels([Area.ShapeRecognition, Area.ShapeEquivalenceRelations, Scope.TwoDimensional, Scope.ThreeDimensional, Ability.ConceptSpecification])
        .addConstraints({ mode: 'same-attribute' })
        .applyConstraintVariants('attribute', ['can-roll', 'can-stack', 'flat-faces'])
        .build();

    // 8. K.G.B.5 Model shapes components (sticks and balls)
    const buildShape = new DatasetPermutationBuilder()
        .addLabels([Area.SpatialModelling, Scope.PhysicalGeometry, Ability.SpatialGeneration])
        .addConstraints({ mode: 'build-shape' })
        .applyConstraintVariants('target', ['triangle', 'square', 'rectangle'])
        .build();

    // 9. K.G.B.5 Trace/draw shapes
    const drawShape = new DatasetPermutationBuilder()
        .addLabels([Area.LinearShapeDrawing, Area.CircularShapeDrawing, Scope.VisualGeometry, Ability.SpatialGeneration])
        .addConstraints({ mode: 'draw-shape' })
        .applyConstraintVariants('target', ['circle', 'triangle', 'square'])
        .build();

    // 10. K.G.B.6 Compose simple shapes
    const composeShapes = new DatasetPermutationBuilder()
        .addLabels([Area.SpatialModelling, Area.ShapeRecognition, Scope.VisualGeometry, Ability.SpatialGeneration])
        .addConstraints({ mode: 'compose-shapes', target: 'rectangle', components: ['triangles'] })
        .build();

    return [
        ...positions,
        ...envShapes,
        ...name2D,
        ...name3D,
        ...classifyDim,
        ...compareAttrs,
        ...sameAttr,
        ...buildShape,
        ...drawShape,
        ...composeShapes
    ];
}

export const generationConfig: DatasetGenerationConfig = {
    permutations: buildPermutations(),
    countPerPermutation: 1,
    seed: SEED
};
