import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {netConstructionEvidence} from '../polyhedral-net-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'solid-net-construction-story',
    generalLabels: [Scope.GeometricNet, Ability.VisualArticulation, Ability.TextualReception],
    compatibility: [requireTargetLabels('solid-net-construction-story-task', [Scope.GeometricNet, Area.ShapeDecomposition, Ability.TextualReception]), netConstructionEvidence]
};
export const SolidNetConstructionStoryViewSchema = {} as const;
export type SolidNetConstructionStoryViewConfig = ConfigFromSchema<typeof SolidNetConstructionStoryViewSchema>;
