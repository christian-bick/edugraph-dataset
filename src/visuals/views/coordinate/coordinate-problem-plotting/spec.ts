import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-problem-plotting',
    generalLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation, Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('coordinate-problem-plotting-task', [Area.PointPlotting, Ability.ProcedureExecution])]
};
export const CoordinateProblemPlottingViewSchema = {} as const;
export type CoordinateProblemPlottingViewConfig = ConfigFromSchema<typeof CoordinateProblemPlottingViewSchema>;
