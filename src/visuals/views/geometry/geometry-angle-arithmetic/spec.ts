import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-arithmetic',
    generalLabels: []
};

export const GeometryAngleArithmeticViewSchema = {} as const;

export type GeometryAngleArithmeticViewConfig = ConfigFromSchema<
    typeof GeometryAngleArithmeticViewSchema
>;
