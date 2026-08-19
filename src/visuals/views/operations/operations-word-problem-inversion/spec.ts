import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-inversion',
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger20]),
        ...deductAdmitting([Scope.NumbersWithNegatives])
    ],
    generalLabels: [
        Ability.TextualReception,
        Ability.ProcedureInversion,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers
    ]
};

export const OperationsWordProblemInversionViewSchema = {} as const;
export type OperationsWordProblemInversionViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemInversionViewSchema
>;
