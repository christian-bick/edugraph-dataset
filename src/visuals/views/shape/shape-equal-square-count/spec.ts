import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-equal-square-count',
    generalLabels: [Ability.ProcedureExecution]
};
export const ShapeEqualSquareCountViewSchema = {} as const;
export type ShapeEqualSquareCountViewConfig = ConfigFromSchema<
    typeof ShapeEqualSquareCountViewSchema
>;
