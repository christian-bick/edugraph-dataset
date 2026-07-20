import { ViewSpec } from '../../../types/view-spec.ts';
import { Ability, Scope } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-same-attribute',
    generalLabels: [
        Ability.VisualRecognition,
        Ability.InductiveReasoning,
        Scope.ShapeProperties
    ],
};


export const GeometrySameAttributeViewSchema = {} as const;

export type GeometrySameAttributeViewConfig = ConfigFromSchema<typeof GeometrySameAttributeViewSchema>;
