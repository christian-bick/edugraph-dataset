import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {summarySelectionClaims, summarySelectionEvidence} from '../summary-selection-view-policy.ts';

export const spec: ViewSpec = {viewId: 'statistical-summary-selection', generalLabels: [Ability.ProcedureApplicability],
    compatibility: [requireTargetLabels('summary-selection-original-comparison-task', summarySelectionClaims), summarySelectionEvidence]};
export const StatisticalSummarySelectionViewSchema = {} as const;
export type StatisticalSummarySelectionViewConfig = ConfigFromSchema<typeof StatisticalSummarySelectionViewSchema>;
