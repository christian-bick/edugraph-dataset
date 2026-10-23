import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {netSurfaceAreaEvidence} from '../polyhedral-net-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'net-surface-area',
    generalLabels: [Scope.GeometricNet, Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('net-surface-area-task', [Scope.GeometricNet, Area.SurfaceAreaCalculation]), netSurfaceAreaEvidence]
};
export const NetSurfaceAreaViewSchema = {} as const;
export type NetSurfaceAreaViewConfig = ConfigFromSchema<typeof NetSurfaceAreaViewSchema>;
