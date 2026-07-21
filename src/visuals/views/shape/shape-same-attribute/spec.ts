import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability, Scope } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-same-attribute',
    generalLabels: [
        Ability.VisualRecognition,
        Ability.InductiveReasoning,
        Scope.ShapeProperties
    ],
};


export const ShapeSameAttributeViewSchema = {} as const;

export type ShapeSameAttributeViewConfig = ConfigFromSchema<typeof ShapeSameAttributeViewSchema>;
