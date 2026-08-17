import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry',
    generalLabels: []
};

export const ShapeLineSymmetryViewSchema = {} as const;

export type ShapeLineSymmetryViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryViewSchema
>;
