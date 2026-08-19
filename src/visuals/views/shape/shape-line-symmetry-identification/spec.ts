import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry-identification',
    generalLabels: [
        Ability.ConceptClassification,
        Ability.VisualRecognition
    ]
};

export const ShapeLineSymmetryIdentificationViewSchema = {} as const;

export type ShapeLineSymmetryIdentificationViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryIdentificationViewSchema
>;
