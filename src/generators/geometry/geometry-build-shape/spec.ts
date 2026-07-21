import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../../types/schema.ts";

import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-build-shape',
    generalLabels: [
        Area.ShapeRecognition,
        Scope.ShapeProperties
    ],
};

export const GeometryBuildShapeGeneratorSchema = {
    target: [
        [Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon],
        selectExactMatch
    ]
} as const;

export type GeometryBuildShapeGeneratorConfig = ConfigFromSchema<typeof GeometryBuildShapeGeneratorSchema>;
