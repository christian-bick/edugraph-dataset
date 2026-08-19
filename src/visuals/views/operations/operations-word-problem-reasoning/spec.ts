import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-reasoning',
    generalLabels: [
        Ability.TextualReception,
        Ability.ResultInterpretation,
        Ability.ProcedureUnderstanding
    ],
    requiredLabels: [Area.Estimation, Area.IntegerRounding]
};

export const OperationsWordProblemReasoningViewSchema = {} as const;
export type OperationsWordProblemReasoningViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemReasoningViewSchema
>;
