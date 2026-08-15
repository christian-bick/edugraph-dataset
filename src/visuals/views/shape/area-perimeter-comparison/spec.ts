import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'area-perimeter-comparison',
    generalLabels: []
};

export const AreaPerimeterComparisonViewSchema = {} as const;

export type AreaPerimeterComparisonViewConfig = ConfigFromSchema<
    typeof AreaPerimeterComparisonViewSchema
>;
