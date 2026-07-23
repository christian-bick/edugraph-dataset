import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.TextualReception,
        Scope.ArabicNumerals
    ]
};


export const OperationsWordProblemViewSchema = {} as const;

export type OperationsWordProblemViewConfig = ConfigFromSchema<typeof OperationsWordProblemViewSchema>;
