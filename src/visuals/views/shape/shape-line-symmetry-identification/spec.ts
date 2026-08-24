import {Ability} from 'edugraph-ts';
import {random} from '../../../../lib/random.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry-identification',
    generalLabels: [
        Ability.ConceptClassification,
        Ability.VisualRecognition
    ]
};

export type IdentificationMultiAxisKind = 'rectangle' | 'square';

export const selectIdentificationMultiAxisKind = (): IdentificationMultiAxisKind =>
    random() < 0.5 ? 'rectangle' : 'square';

export const ShapeLineSymmetryIdentificationViewSchema = {
    multiAxisKind: selectIdentificationMultiAxisKind
} as const;

export type ShapeLineSymmetryIdentificationViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryIdentificationViewSchema
>;
