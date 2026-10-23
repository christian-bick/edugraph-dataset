import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {netSurfaceAreaEvidence} from '../polyhedral-net-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'net-surface-area-story',
    generalLabels: [Scope.GeometricNet, Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [requireTargetLabels('net-surface-area-story-task', [Scope.GeometricNet, Area.SurfaceAreaCalculation, Ability.TextualReception]), netSurfaceAreaEvidence]
};
export const NetSurfaceAreaStoryViewSchema = {} as const;
export type NetSurfaceAreaStoryViewConfig = ConfigFromSchema<typeof NetSurfaceAreaStoryViewSchema>;
