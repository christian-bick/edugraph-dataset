import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {viewId: 'geometry-angle-arithmetic-execution', generalLabels: [Ability.ProcedureExecution]};
export const GeometryAngleArithmeticExecutionViewSchema = {} as const;
export type GeometryAngleArithmeticExecutionViewConfig = ConfigFromSchema<typeof GeometryAngleArithmeticExecutionViewSchema>;
