import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compare-attributes',
    generalLabels: [
        Ability.VisualDecomposition
    ],
};


export const GeometryCompareAttributesViewSchema = {} as const;

export type GeometryCompareAttributesViewConfig = ConfigFromSchema<typeof GeometryCompareAttributesViewSchema>;
