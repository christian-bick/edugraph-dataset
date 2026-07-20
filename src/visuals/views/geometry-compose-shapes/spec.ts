import { ViewSpec } from '../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compose-shapes',
    generalLabels: [
        Ability.ConceptComposition
    ]
};


// TODO: Ontological relations between shapes could allow us to deduct what can be composed into what.
export const GeometryComposeShapesViewSchema = {} as const;

export type GeometryComposeShapesViewConfig = ConfigFromSchema<typeof GeometryComposeShapesViewSchema>;
