import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'polygon-area-composition-story',
    generalLabels: [Ability.ProcedureExecution, Ability.SpatialGeneration, Ability.TextualReception],
    compatibility: [requireTargetLabels('polygon-area-composition-story-task', [Area.AreaCalculation, Area.ShapeSynthesis, Ability.TextualReception])]
};
export const PolygonAreaCompositionStoryViewSchema = {} as const;
export type PolygonAreaCompositionStoryViewConfig = ConfigFromSchema<typeof PolygonAreaCompositionStoryViewSchema>;
