import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-axis-distance',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('coordinate-axis-distance-task', [Area.CoordinateDistance, Area.AbsoluteNumberMagnitude])]
};
export const CoordinateAxisDistanceViewSchema = {} as const;
export type CoordinateAxisDistanceViewConfig = ConfigFromSchema<typeof CoordinateAxisDistanceViewSchema>;
