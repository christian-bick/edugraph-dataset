import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {centerSummaryOriginalTask, centerSummaryEvidence} from '../summary-meaning-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'center-summary-interpretation',
    generalLabels: [Ability.Interpretation],
    compatibility: [centerSummaryOriginalTask, centerSummaryEvidence]
};
export const CenterSummaryInterpretationViewSchema = {} as const;
export type CenterSummaryInterpretationViewConfig = ConfigFromSchema<typeof CenterSummaryInterpretationViewSchema>;
