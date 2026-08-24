import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-equal-square-count-story',
    generalLabels: [Ability.ProcedureExecution, Ability.TextualReception]
};
export const ShapeEqualSquareCountStoryViewSchema = {} as const;
export type ShapeEqualSquareCountStoryViewConfig = ConfigFromSchema<
    typeof ShapeEqualSquareCountStoryViewSchema
>;
