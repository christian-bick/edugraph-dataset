import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-rectangle-area-inversion',
    generalLabels: [Ability.ProcedureInversion]
};
export const ShapeRectangleAreaInversionViewSchema = {} as const;
export type ShapeRectangleAreaInversionViewConfig = ConfigFromSchema<
    typeof ShapeRectangleAreaInversionViewSchema
>;
