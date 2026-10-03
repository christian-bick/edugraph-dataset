import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-scaling-explanation',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation],
    compatibility: [requireTargetLabels('fraction-scaling-explanation-request', [Ability.TextualArticulation])]
};

export const FractionsScalingExplanationViewSchema = {} as const;
export type FractionsScalingExplanationViewConfig = ConfigFromSchema<typeof FractionsScalingExplanationViewSchema>;
