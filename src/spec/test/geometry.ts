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
    }))
];
