import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-point-reading',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.VisualReception],
    compatibility: [requireTargetLabels('coordinate-point-reading-task', [Ability.VisualReception])]
};
export const CoordinatePointReadingViewSchema = {} as const;
export type CoordinatePointReadingViewConfig = ConfigFromSchema<typeof CoordinatePointReadingViewSchema>;
