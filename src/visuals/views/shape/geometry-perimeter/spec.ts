import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-perimeter',
    generalLabels: []
};

export const GeometryPerimeterViewSchema = {
    responseMode: [Ability.ProcedureExecution, Ability.ProcedureInversion]
} as const;

export type GeometryPerimeterViewConfig = ConfigFromSchema<
    typeof GeometryPerimeterViewSchema
>;
