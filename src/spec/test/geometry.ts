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

const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square],
        [Area.Triangle]
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
    }))
];
