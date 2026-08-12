import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../../types/schema.ts";

import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';
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
        [Scope.ShapeProperties],
        matchAllExactLabels
    ],
    specifyAttributes: [
        [Ability.ConceptSpecification],
        hasLabel(Ability.ConceptSpecification)
    ],
    shapeIdentity: [
        [Area.ShapeIdentity],
        hasLabel(Area.ShapeIdentity)
    ],
    attributeCounts: [
        [Scope.VertexCount, Scope.FaceCount, Scope.Equal],
        matchAllExactLabels
    ]
} as const;

export type ShapeBuildShapeGeneratorConfig = ConfigFromSchema<typeof ShapeBuildShapeGeneratorSchema>;
