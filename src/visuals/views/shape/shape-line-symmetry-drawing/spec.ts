import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry-drawing',
    generalLabels: [Ability.VisualArticulation]
};

export const ShapeLineSymmetryDrawingViewSchema = {} as const;

export type ShapeLineSymmetryDrawingViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryDrawingViewSchema
>;
