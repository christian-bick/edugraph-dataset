import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-compose-shapes',
    generalLabels: [
        Ability.ConceptComposition
    ]
};


// TODO: Ontological relations between shapes could allow us to deduct what can be composed into what.
export const ShapeComposeShapesViewSchema = {} as const;

export type ShapeComposeShapesViewConfig = ConfigFromSchema<typeof ShapeComposeShapesViewSchema>;
