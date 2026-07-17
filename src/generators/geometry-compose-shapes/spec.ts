import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compose-shapes',
    supportedLabels: [
        Area.Rectangle,
        Area.Square,
        Area.Triangle
    ]
};

export const GeometryComposeShapesGeneralLabels = [];

export const GeometryComposeShapesGeneratorSchema = {
    wantsRectangle: [
        [Area.Rectangle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Rectangle)
    ],
    wantsSquare: [
        [Area.Square], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Square)
    ],
    wantsTriangle: [
        [Area.Triangle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Triangle)
    ]
} as const;

export type GeometryComposeShapesGeneratorConfig = ConfigFromSchema<typeof GeometryComposeShapesGeneratorSchema>;
