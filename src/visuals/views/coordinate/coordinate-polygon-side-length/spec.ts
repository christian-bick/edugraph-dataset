import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-polygon-side-length',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('coordinate-polygon-side-length-task', [Area.CoordinateDistance])]
};
export const CoordinatePolygonSideLengthViewSchema = {} as const;
export type CoordinatePolygonSideLengthViewConfig = ConfigFromSchema<typeof CoordinatePolygonSideLengthViewSchema>;
