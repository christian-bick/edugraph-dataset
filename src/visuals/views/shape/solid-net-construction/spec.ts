import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {netConstructionEvidence} from '../polyhedral-net-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'solid-net-construction',
    generalLabels: [Scope.GeometricNet, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('solid-net-construction-task', [Scope.GeometricNet, Area.ShapeDecomposition]), netConstructionEvidence]
};
export const SolidNetConstructionViewSchema = {} as const;
export type SolidNetConstructionViewConfig = ConfigFromSchema<typeof SolidNetConstructionViewSchema>;
