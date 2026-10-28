import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-contextual-order-writing',
    generalLabels: [Ability.Formalization, Ability.TextualReception, Scope.ArabicNumerals, Scope.Base10],
    compatibility: [requireTargetLabels('numbers-contextual-order-writing-task', [Ability.Formalization])]
};
export const NumbersContextualOrderWritingViewSchema = {} as const;
export type NumbersContextualOrderWritingViewConfig = ConfigFromSchema<typeof NumbersContextualOrderWritingViewSchema>;
