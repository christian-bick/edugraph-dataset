import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'polygon-area-decomposition',
    generalLabels: [Ability.ProcedureExecution, Ability.VisualDecomposition],
    compatibility: [requireTargetLabels('polygon-area-decomposition-task', [Area.AreaCalculation, Area.ShapeDecomposition])]
};
export const PolygonAreaDecompositionViewSchema = {} as const;
export type PolygonAreaDecompositionViewConfig = ConfigFromSchema<typeof PolygonAreaDecompositionViewSchema>;
