import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-rational-line-positioning',
    generalLabels: [Scope.Numberline, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('rational-line-positioning-task', [Ability.VisualArticulation])]
};
export const NumbersRationalLinePositioningViewSchema = {} as const;
export type NumbersRationalLinePositioningViewConfig = ConfigFromSchema<typeof NumbersRationalLinePositioningViewSchema>;
