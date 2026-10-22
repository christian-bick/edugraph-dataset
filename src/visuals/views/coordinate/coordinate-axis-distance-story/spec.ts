import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-axis-distance-story',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('coordinate-axis-distance-story-task', [Area.CoordinateDistance, Area.AbsoluteNumberMagnitude, Ability.TextualReception])]
};
export const CoordinateAxisDistanceStoryViewSchema = {} as const;
export type CoordinateAxisDistanceStoryViewConfig = ConfigFromSchema<typeof CoordinateAxisDistanceStoryViewSchema>;
