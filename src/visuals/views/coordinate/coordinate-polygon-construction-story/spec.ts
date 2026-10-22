import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-polygon-construction-story',
    generalLabels: [Area.ShapePlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation, Ability.TextualReception],
    compatibility: [requireTargetLabels('coordinate-polygon-construction-story-task', [Area.ShapePlotting, Ability.TextualReception])]
};
export const CoordinatePolygonConstructionStoryViewSchema = {} as const;
export type CoordinatePolygonConstructionStoryViewConfig = ConfigFromSchema<typeof CoordinatePolygonConstructionStoryViewSchema>;
