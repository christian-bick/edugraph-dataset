import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-patterns-identification',
    generalLabels: [Ability.ConceptClassification]
};

export const ShapePatternsIdentificationViewSchema = {} as const;

export type ShapePatternsIdentificationViewConfig = ConfigFromSchema<
    typeof ShapePatternsIdentificationViewSchema
>;
