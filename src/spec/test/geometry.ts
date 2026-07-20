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

export const GeometryTestSpec: CompetencyTarget[] = [
    ...builder.build().map((p, i) => ({
        id: `test-geometry-build-shape-${i}`,
        labels: p.labels,
        constraints: p.constraints
    }))
];
