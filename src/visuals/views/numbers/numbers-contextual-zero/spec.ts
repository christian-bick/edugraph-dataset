import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-contextual-zero',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation],
    compatibility: [requireTargetLabels('numbers-contextual-zero-task', [Area.ZeroConcept, Ability.TextualArticulation])]
};
export const NumbersContextualZeroViewSchema = {} as const;
export type NumbersContextualZeroViewConfig = ConfigFromSchema<typeof NumbersContextualZeroViewSchema>;
