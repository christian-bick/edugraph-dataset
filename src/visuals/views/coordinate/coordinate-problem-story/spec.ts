import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-problem-story',
    generalLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation, Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('coordinate-problem-story-task', [Area.PointPlotting, Ability.ProcedureExecution, Ability.TextualReception])]
};
export const CoordinateProblemStoryViewSchema = {} as const;
export type CoordinateProblemStoryViewConfig = ConfigFromSchema<typeof CoordinateProblemStoryViewSchema>;
