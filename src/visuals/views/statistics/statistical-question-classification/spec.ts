import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'statistical-question-classification',
    generalLabels: [Ability.ConceptClassification]
};
export const StatisticalQuestionClassificationViewSchema = {} as const;
export type StatisticalQuestionClassificationViewConfig = ConfigFromSchema<typeof StatisticalQuestionClassificationViewSchema>;
