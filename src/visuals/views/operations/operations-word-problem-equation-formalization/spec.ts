import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem-equation-formalization',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.TextualReception,
        Ability.Formalization
    ],
    requiredLabels: [Area.Equation]
};

export const OperationsWordProblemEquationFormalizationViewSchema = {} as const;
export type OperationsWordProblemEquationFormalizationViewConfig = ConfigFromSchema<
    typeof OperationsWordProblemEquationFormalizationViewSchema
>;
