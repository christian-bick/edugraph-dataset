import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-coordinate-plotting',
    generalLabels: [Area.PointPlotting, Scope.TabularAlgebraicRepresentation, Scope.CartesianCoordinateSystem, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('ratio-points-request', [Area.PointPlotting])]
};

export const RatioCoordinatePlottingViewSchema = {} as const;
export type RatioCoordinatePlottingViewConfig = ConfigFromSchema<typeof RatioCoordinatePlottingViewSchema>;
