import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { hasSubConcept } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compare-attributes',
    supportedLabels: [
        Ability.VisualDecomposition,
        Area.Circle,
        Area.Hexagon
    ],
};


export const GeometryCompareAttributesViewSchema = {
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

export type GeometryCompareAttributesViewConfig = ConfigFromSchema<typeof GeometryCompareAttributesViewSchema>;
