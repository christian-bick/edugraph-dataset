import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-signed-context-interpretation',
    generalLabels: [Ability.Interpretation],
    compatibility: [requireTargetLabels('numbers-signed-context-interpretation-task', [Area.SignNotation])]
};
export const NumbersSignedContextInterpretationViewSchema = {} as const;
export type NumbersSignedContextInterpretationViewConfig = ConfigFromSchema<typeof NumbersSignedContextInterpretationViewSchema>;
