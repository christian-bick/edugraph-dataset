import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { hasSubConcept } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compare-attributes',
    generalLabels: [
        Ability.VisualDecomposition,
        Area.Circle,
        Area.Hexagon
    ],
};


export const GeometryCompareAttributesViewSchema = {} as const;

export type GeometryCompareAttributesViewConfig = ConfigFromSchema<typeof GeometryCompareAttributesViewSchema>;
