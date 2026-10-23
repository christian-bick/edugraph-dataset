import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {variationSummaryOriginalTask, variationSummaryEvidence} from '../summary-meaning-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'contextual-variation-summary',
    generalLabels: [Ability.ProcedureExecution, Ability.Interpretation],
    compatibility: [requireTargetLabels('contextual-variation-summary-original-complete-task', [Ability.ProcedureExecution, Ability.Interpretation]),
        variationSummaryOriginalTask, variationSummaryEvidence]
};
export const ContextualVariationSummaryViewSchema = {} as const;
export type ContextualVariationSummaryViewConfig = ConfigFromSchema<typeof ContextualVariationSummaryViewSchema>;
