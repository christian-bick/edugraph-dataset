import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-rectangle-area',
    generalLabels: [Ability.ProcedureExecution]
};
export const ShapeRectangleAreaViewSchema = {} as const;
export type ShapeRectangleAreaViewConfig = ConfigFromSchema<
    typeof ShapeRectangleAreaViewSchema
>;
