import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compare-attributes',
    generalLabels: [
        Area.Circle,
        Area.Hexagon
    ]
};


export const GeometryCompareAttributesGeneratorSchema = {
    wantsTriangle: [
        [Area.Triangle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Triangle)
    ],
    wantsSquare: [
        [Area.Square], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Square)
    ],
    wantsRectangle: [
        [Area.Rectangle], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Rectangle)
    ],
    wantsPolygon: [
        [Area.Polygon], // TODO: Consider ontological relations if applicable
        hasSubConcept(Area.Polygon)
    ]
} as const;

export type GeometryCompareAttributesGeneratorConfig = ConfigFromSchema<typeof GeometryCompareAttributesGeneratorSchema>;
