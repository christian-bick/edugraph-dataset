import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-inherited-attributes',
    generalLabels: [Ability.ConceptDerivation]
};

export const ShapeInheritedAttributesViewSchema = {} as const;
export type ShapeInheritedAttributesViewConfig = ConfigFromSchema<typeof ShapeInheritedAttributesViewSchema>;
