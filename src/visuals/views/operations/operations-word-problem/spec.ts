import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
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


export const OperationsWordProblemViewSchema = {
    invertProcedure: [
        [Ability.ProcedureInversion],
        hasLabel(Ability.ProcedureInversion)
    ]
} as const;

export type OperationsWordProblemViewConfig = ConfigFromSchema<typeof OperationsWordProblemViewSchema>;
