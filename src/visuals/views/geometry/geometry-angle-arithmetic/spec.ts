import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-arithmetic',
    generalLabels: [Ability.ProcedureUnderstanding]
};

export const GeometryAngleArithmeticViewSchema = {} as const;

export type GeometryAngleArithmeticViewConfig = ConfigFromSchema<
    typeof GeometryAngleArithmeticViewSchema
>;
