import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-signed-context-formalization',
    generalLabels: [Ability.Formalization, Ability.TextualReception],
    compatibility: [requireTargetLabels('numbers-signed-context-formalization-task', [Area.SignNotation, Ability.Formalization, Ability.TextualReception])]
};
export const NumbersSignedContextFormalizationViewSchema = {} as const;
export type NumbersSignedContextFormalizationViewConfig = ConfigFromSchema<typeof NumbersSignedContextFormalizationViewSchema>;
