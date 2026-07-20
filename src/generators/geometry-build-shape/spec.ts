import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from "../../types/schema.ts";

export const spec: GeneratorSpec = {
    generatorId: 'geometry-build-shape',
    generalLabels: [
        Area.ShapeRecognition,
        Scope.ShapeProperties
    ],
};

export const GeometryBuildShapeGeneratorSchema = {
    target: [
        Area.Triangle,
        Area.Square,
        Area.Rectangle
    ]
} as const;

export type GeometryBuildShapeGeneratorConfig = ConfigFromSchema<typeof GeometryBuildShapeGeneratorSchema>;
