import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'currency-word-problem',
    generalLabels: [Ability.TextualReception]
};

export const CurrencyWordProblemViewSchema = {} as const;
export type CurrencyWordProblemViewConfig = ConfigFromSchema<typeof CurrencyWordProblemViewSchema>;
