import {ViewSpec} from '../../../../types/view-spec.ts';
import {resolveVerticalEquationPresentation, verticalEquationPresentationLabels, verticalEquationPresentationRule} from '../arithmetic-equation-presentation.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical',
    compatibility: [verticalEquationPresentationRule],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const OperationsVerticalViewSchema = {
    presentation: [verticalEquationPresentationLabels, resolveVerticalEquationPresentation,
        [[], [Area.Equation, Scope.ExpressionOnOneSide], [Area.Equation, Scope.ExpressionOnBothSides]]]
} as const;

export type OperationsVerticalViewConfig = ConfigFromSchema<typeof OperationsVerticalViewSchema>;
