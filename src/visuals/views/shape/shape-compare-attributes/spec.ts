import { ViewSpec } from '../../../../types/view-spec.ts';
import { Ability } from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-compare-attributes',
    generalLabels: [
        Ability.VisualDecomposition
    ],
};


export const ShapeCompareAttributesViewSchema = {} as const;

export type ShapeCompareAttributesViewConfig = ConfigFromSchema<typeof ShapeCompareAttributesViewSchema>;
