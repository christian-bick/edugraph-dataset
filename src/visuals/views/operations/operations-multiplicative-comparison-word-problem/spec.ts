import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-multiplicative-comparison-word-problem',
    generalLabels: [
        Ability.TextualReception,
        Scope.ArabicNumerals
    ]
};

export const OperationsMultiplicativeComparisonWordProblemViewSchema = {} as const;

export type OperationsMultiplicativeComparisonWordProblemViewConfig = ConfigFromSchema<
    typeof OperationsMultiplicativeComparisonWordProblemViewSchema
>;
