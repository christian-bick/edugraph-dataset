import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-equation-judgment',
    generalLabels: [
        Area.Equation,
        Scope.ArabicNumerals,
        Ability.PlausibilityEvaluation
    ]
};

export const OperationsEquationJudgmentViewSchema = {} as const;

export type OperationsEquationJudgmentViewConfig = ConfigFromSchema<typeof OperationsEquationJudgmentViewSchema>;
