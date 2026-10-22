import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-contextual-absolute-value',
    generalLabels: [Ability.Interpretation, Ability.Formalization],
    compatibility: [requireTargetLabels('numbers-contextual-absolute-value-task', [Ability.Interpretation, Ability.Formalization])]
};
export const NumbersContextualAbsoluteValueViewSchema = {} as const;
export type NumbersContextualAbsoluteValueViewConfig = ConfigFromSchema<typeof NumbersContextualAbsoluteValueViewSchema>;
