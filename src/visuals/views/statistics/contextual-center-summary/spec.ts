import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {centerSummaryOriginalTask, centerSummaryEvidence} from '../summary-meaning-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'contextual-center-summary',
    generalLabels: [Ability.ProcedureExecution, Ability.Interpretation],
    compatibility: [requireTargetLabels('contextual-center-summary-original-complete-task', [Ability.ProcedureExecution, Ability.Interpretation]),
        centerSummaryOriginalTask, centerSummaryEvidence]
};
export const ContextualCenterSummaryViewSchema = {} as const;
export type ContextualCenterSummaryViewConfig = ConfigFromSchema<typeof ContextualCenterSummaryViewSchema>;
