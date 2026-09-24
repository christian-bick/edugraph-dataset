import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-remainder-interpretation',
    generalLabels: [Ability.TextualReception, Ability.ResultInterpretation]
};

export const OperationsWordProblemRemainderInterpretationViewSchema = {} as const;
export type OperationsWordProblemRemainderInterpretationViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemRemainderInterpretationViewSchema
>;
