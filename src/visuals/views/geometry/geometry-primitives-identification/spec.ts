import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-primitives-identification',
    generalLabels: [Ability.VisualRecognition]
};

export const GeometryPrimitivesIdentificationViewSchema = {} as const;

export type GeometryPrimitivesIdentificationViewConfig = ConfigFromSchema<
    typeof GeometryPrimitivesIdentificationViewSchema
>;
