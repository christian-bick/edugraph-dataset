import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-classify-attributes',
    generalLabels: [
        Ability.ConceptClassification
    ]
};

export const ShapeClassifyAttributesViewSchema = {} as const;

export type ShapeClassifyAttributesViewConfig =
    ConfigFromSchema<typeof ShapeClassifyAttributesViewSchema>;
