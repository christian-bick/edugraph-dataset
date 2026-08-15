import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-perimeter',
    generalLabels: []
};

export const GeometryPerimeterViewSchema = {} as const;

export type GeometryPerimeterViewConfig = ConfigFromSchema<
    typeof GeometryPerimeterViewSchema
>;
