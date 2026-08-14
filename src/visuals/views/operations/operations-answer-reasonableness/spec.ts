import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-answer-reasonableness',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ConceptDerivation
    ],
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger1000])
    ]
};

export const OperationsAnswerReasonablenessViewSchema = {} as const;

export type OperationsAnswerReasonablenessViewConfig = ConfigFromSchema<
    typeof OperationsAnswerReasonablenessViewSchema
>;
