import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-sign-reflection',
    generalLabels: [Scope.CartesianCoordinateSystem, Ability.Interpretation],
    compatibility: [requireTargetLabels('coordinate-sign-reflection-task', [Area.Reflection])]
};
export const CoordinateSignReflectionViewSchema = {} as const;
export type CoordinateSignReflectionViewConfig = ConfigFromSchema<typeof CoordinateSignReflectionViewSchema>;
