import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-rectangle-area-story',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception]
};
export const ShapeRectangleAreaStoryViewSchema = {} as const;
export type ShapeRectangleAreaStoryViewConfig = ConfigFromSchema<
    typeof ShapeRectangleAreaStoryViewSchema
>;
