import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-same-attribute',
    generalLabels: [
        Ability.VisualRecognition,
        Ability.ConceptClassification,
    ],
};


export const ShapeSameAttributeViewSchema = {} as const;

export type ShapeSameAttributeViewConfig = ConfigFromSchema<typeof ShapeSameAttributeViewSchema>;
