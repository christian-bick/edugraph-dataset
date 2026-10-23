import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {variationSummaryOriginalTask, variationSummaryEvidence} from '../summary-meaning-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'variation-summary-interpretation',
    generalLabels: [Ability.Interpretation],
    compatibility: [variationSummaryOriginalTask, variationSummaryEvidence]
};
export const VariationSummaryInterpretationViewSchema = {} as const;
export type VariationSummaryInterpretationViewConfig = ConfigFromSchema<typeof VariationSummaryInterpretationViewSchema>;
