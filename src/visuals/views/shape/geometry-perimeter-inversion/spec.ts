import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-perimeter-inversion',
    generalLabels: [Ability.ProcedureInversion]
};

export const GeometryPerimeterInversionViewSchema = {} as const;

export type GeometryPerimeterInversionViewConfig = ConfigFromSchema<
    typeof GeometryPerimeterInversionViewSchema
>;
