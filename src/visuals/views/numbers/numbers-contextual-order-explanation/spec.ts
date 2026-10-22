import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-contextual-order-explanation',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation, Ability.TextualReception],
    compatibility: [requireTargetLabels('numbers-contextual-order-explanation-task', [Ability.Interpretation, Ability.TextualArticulation])]
};
export const NumbersContextualOrderExplanationViewSchema = {} as const;
export type NumbersContextualOrderExplanationViewConfig = ConfigFromSchema<typeof NumbersContextualOrderExplanationViewSchema>;
