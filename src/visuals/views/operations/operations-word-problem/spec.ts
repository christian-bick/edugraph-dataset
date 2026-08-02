import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem',
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger20]),
        ...deductAdmitting([Scope.NumbersWithNegatives])
    ],
    generalLabels: [
        Ability.TextualReception,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers
    ]
};


export const OperationsWordProblemViewSchema = {} as const;

export type OperationsWordProblemViewConfig = ConfigFromSchema<typeof OperationsWordProblemViewSchema>;
