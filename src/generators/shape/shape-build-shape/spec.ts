import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../../types/schema.ts";

import {matchAllExactLabels, selectExactMatch} from '../../../lib/resolvers.ts';
import {PLANE_SHAPE_LABELS} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-build-shape',
    generalLabels: [],
};

export const ShapeBuildShapeGeneratorSchema = {
    targets: [
        [...PLANE_SHAPE_LABELS, Area.Quadrilateral, Area.Pentagon, Area.Cube],
        matchAllExactLabels
    ],
    constructionScopes: [
        [Scope.ShapeProperties, Scope.ShapeAttributes],
        matchAllExactLabels
    ],
    shapeArea: [
        [
            Area.ShapeIdentity,
            Area.ShapeClassification,
            Area.ShapeRotationConservation,
            Area.ShapeSubsumption
        ],
        selectExactMatch
    ],
    attributeCounts: [
        [Scope.VertexCount, Scope.AngleCount, Scope.FaceCount, Scope.Equal],
        matchAllExactLabels
    ]
} as const;

export type ShapeBuildShapeGeneratorConfig = ConfigFromSchema<typeof ShapeBuildShapeGeneratorSchema>;
