import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability, Scope } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-same-attribute',
    supportedLabels: [
        Ability.VisualRecognition,
        Ability.InductiveReasoning,
        Scope.ShapeProperties
    ],
};

export const GeometrySameAttributeGeneralLabels = [
    Ability.VisualRecognition,
    Ability.InductiveReasoning,
    Scope.ShapeProperties
];

export const GeometrySameAttributeViewSchema = {} as const;

export type GeometrySameAttributeViewConfig = ConfigFromSchema<typeof GeometrySameAttributeViewSchema>;
