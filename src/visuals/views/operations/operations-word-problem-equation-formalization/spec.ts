import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-equation-formalization',
    compatibility: [
        requireTargetLabels('formalization-request', [Ability.Formalization])
    ],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.TextualReception,
        Ability.Formalization
    ]
};

export const OperationsWordProblemEquationFormalizationViewSchema = {} as const;
export type OperationsWordProblemEquationFormalizationViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemEquationFormalizationViewSchema
>;
