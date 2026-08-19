import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
export const spec: ViewSpec = {viewId: 'geometry-angle-arithmetic-inversion', generalLabels: [Ability.ProcedureInversion]};
export const GeometryAngleArithmeticInversionViewSchema = {} as const;
export type GeometryAngleArithmeticInversionViewConfig = ConfigFromSchema<typeof GeometryAngleArithmeticInversionViewSchema>;
