import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-polygon-side-length-story',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('coordinate-polygon-side-length-story-task', [Area.CoordinateDistance, Ability.TextualReception])]
};
export const CoordinatePolygonSideLengthStoryViewSchema = {} as const;
export type CoordinatePolygonSideLengthStoryViewConfig = ConfigFromSchema<typeof CoordinatePolygonSideLengthStoryViewSchema>;
