import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-polygon-construction',
    generalLabels: [Area.ShapePlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('coordinate-polygon-construction-task', [Area.ShapePlotting])]
};
export const CoordinatePolygonConstructionViewSchema = {} as const;
export type CoordinatePolygonConstructionViewConfig = ConfigFromSchema<typeof CoordinatePolygonConstructionViewSchema>;
