import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-word-problem-grade4',
    generalLabels: [Ability.TextualReception, Scope.ArabicNumerals, Scope.Base10]
};

export const MeasurementWordProblemGrade4ViewSchema = {} as const;

export type MeasurementWordProblemGrade4ViewConfig = ConfigFromSchema<
    typeof MeasurementWordProblemGrade4ViewSchema
>;
