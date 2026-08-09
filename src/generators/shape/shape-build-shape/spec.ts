import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../../types/schema.ts";

import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {PLANE_SHAPE_LABELS} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-build-shape',
    generalLabels: [],
};

export const ShapeBuildShapeGeneratorSchema = {
    target: [
        PLANE_SHAPE_LABELS,
        selectExactMatch
    ],
    attributeScope: [
        [Scope.ShapeProperties, Scope.ShapeAttributes],
        selectExactMatch
    ],
    specifyAttributes: [
        [Ability.ConceptSpecification],
        hasLabel(Ability.ConceptSpecification)
    ],
    shapeIdentity: [
        [Area.ShapeIdentity],
        hasLabel(Area.ShapeIdentity)
    ]
} as const;

export type ShapeBuildShapeGeneratorConfig = ConfigFromSchema<typeof ShapeBuildShapeGeneratorSchema>;
