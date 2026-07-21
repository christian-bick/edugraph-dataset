import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../../types/schema.ts";

import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-build-shape',
    generalLabels: [
        Area.ShapeRecognition,
        Scope.ShapeProperties
    ],
};

export const ShapeBuildShapeGeneratorSchema = {
    target: [
        [Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon],
        selectExactMatch
    ]
} as const;

export type ShapeBuildShapeGeneratorConfig = ConfigFromSchema<typeof ShapeBuildShapeGeneratorSchema>;
