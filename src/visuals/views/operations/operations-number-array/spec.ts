import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactMatch} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-array',
    generalLabels: [
        Scope.NumberArray,
        Scope.ExpressionOnOneSide,
        Scope.ArabicNumerals
    ]
};

export const OperationsNumberArrayViewSchema = {
    responseMode: [
        [Ability.ProcedureExecution, Ability.Formalization, Ability.Interpretation],
        selectExactMatch
    ],
    showEquation: [
        [Area.Equation],
        hasLabel(Area.Equation)
    ]
} as const;

export type OperationsNumberArrayViewConfig = ConfigFromSchema<typeof OperationsNumberArrayViewSchema>;
