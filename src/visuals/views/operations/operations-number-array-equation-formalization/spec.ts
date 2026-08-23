import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-array-equation-formalization',
    generalLabels: [
        Area.Equation,
        Scope.NumberArray,
        Scope.ExpressionOnOneSide,
        Scope.ArabicNumerals,
        Ability.Formalization
    ]
};

export const OperationsNumberArrayEquationFormalizationViewSchema = {} as const;

export type OperationsNumberArrayEquationFormalizationViewConfig = ConfigFromSchema<
    typeof OperationsNumberArrayEquationFormalizationViewSchema
>;
