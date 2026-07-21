import DatasetPermutationBuilder from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../ccss/kindergarten.ts';

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

// TODO: The geometry-compose-shapes generator only supports rectangle and square as
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

export const GeometryTestSpec: CompetencyTarget[] = [
    ...builder.build().map((p, i) => ({
        id: `test-geometry-build-shape-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...classifyDimBuilder.build().map((p, i) => ({
        id: `test-geometry-classify-dim-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...compareAttrBuilder.build().map((p, i) => ({
        id: `test-geometry-compare-attributes-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...composeShapesBuilder.build().map((p, i) => ({
        id: `test-geometry-compose-shapes-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...envShapesBuilder.build().map((p, i) => ({
        id: `test-geometry-env-shapes-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...identityNamingBuilder.build().map((p, i) => ({
        id: `test-geometry-identity-naming-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...identityDrawBuilder.build().map((p, i) => ({
        id: `test-geometry-identity-draw-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...identityPositionBuilder.build().map((p, i) => ({
        id: `test-geometry-identity-position-${i}`,
        labels: p.labels,
        constraints: p.constraints
    })),
    ...sameAttributeBuilder.build().map((p, i) => ({
        id: `test-geometry-same-attribute-${i}`,
        labels: p.labels,
        constraints: p.constraints
    }))
];
