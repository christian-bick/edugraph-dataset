import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-quadrant-interpretation',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.Interpretation],
    compatibility: [requireTargetLabels('coordinate-quadrant-interpretation-task', [Area.Quadrants])]
};
export const CoordinateQuadrantInterpretationViewSchema = {} as const;
export type CoordinateQuadrantInterpretationViewConfig = ConfigFromSchema<typeof CoordinateQuadrantInterpretationViewSchema>;
