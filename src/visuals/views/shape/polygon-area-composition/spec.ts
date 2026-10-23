import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'polygon-area-composition',
    generalLabels: [Ability.ProcedureExecution, Ability.SpatialGeneration],
    compatibility: [requireTargetLabels('polygon-area-composition-task', [Area.AreaCalculation, Area.ShapeSynthesis])]
};
export const PolygonAreaCompositionViewSchema = {} as const;
export type PolygonAreaCompositionViewConfig = ConfigFromSchema<typeof PolygonAreaCompositionViewSchema>;
