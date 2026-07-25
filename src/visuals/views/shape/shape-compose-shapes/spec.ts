import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-compose-shapes',
    generalLabels: [
        Ability.ConceptComposition
    ]
};

export const ShapeComposeShapesViewSchema = {} as const;

export type ShapeComposeShapesViewConfig = ConfigFromSchema<typeof ShapeComposeShapesViewSchema>;
