import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-point-plotting',
    generalLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('coordinate-point-plotting-task', [Area.PointPlotting])]
};
export const CoordinatePointPlottingViewSchema = {} as const;
export type CoordinatePointPlottingViewConfig = ConfigFromSchema<typeof CoordinatePointPlottingViewSchema>;
