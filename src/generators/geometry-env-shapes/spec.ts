import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-env-shapes',
    supportedLabels: [
        Area.Square,
        Area.Rectangle,
        Area.Circle,
        Area.ShapeRecognition
    ]
};

export const GeometryEnvShapesGeneralLabels = [
    Area.ShapeRecognition
];

export const GeometryEnvShapesGeneratorSchema = {
    wantsSquare: [
        [Area.Square], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Square)
    ],
    wantsRectangle: [
        [Area.Rectangle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Rectangle)
    ],
    wantsCircle: [
        [Area.Circle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Circle)
    ]
} as const;

export type GeometryEnvShapesGeneratorConfig = ConfigFromSchema<typeof GeometryEnvShapesGeneratorSchema>;
