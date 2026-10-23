import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'polygon-area-decomposition-story',
    generalLabels: [Ability.ProcedureExecution, Ability.VisualDecomposition, Ability.TextualReception],
    compatibility: [requireTargetLabels('polygon-area-decomposition-story-task', [Area.AreaCalculation, Area.ShapeDecomposition, Ability.TextualReception])]
};
export const PolygonAreaDecompositionStoryViewSchema = {} as const;
export type PolygonAreaDecompositionStoryViewConfig = ConfigFromSchema<typeof PolygonAreaDecompositionStoryViewSchema>;
