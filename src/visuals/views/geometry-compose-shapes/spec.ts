import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { hasSubConcept } from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compose-shapes',
    generalLabels: [
        Ability.ConceptComposition
    ]
};


// TODO: Ontological relations between shapes could allow us to deduct what can be composed into what.
export const GeometryComposeShapesViewSchema = {
    hasTriangle: [
        [Area.Triangle],
        hasSubConcept(Area.Triangle)
    ],
    hasCircle: [
        [Area.Circle],
        hasSubConcept(Area.Circle)
    ]
} as const;

export type GeometryComposeShapesViewConfig = ConfigFromSchema<typeof GeometryComposeShapesViewSchema>;
