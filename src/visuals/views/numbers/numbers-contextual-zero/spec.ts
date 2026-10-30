import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-contextual-zero',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation, Scope.ArabicNumerals, Scope.Base10],
    compatibility: [requireTargetLabels('numbers-contextual-zero-task', [Area.Zero, Ability.TextualArticulation])]
};
export const NumbersContextualZeroViewSchema = {} as const;
export type NumbersContextualZeroViewConfig = ConfigFromSchema<typeof NumbersContextualZeroViewSchema>;
