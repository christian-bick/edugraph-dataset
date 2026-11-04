import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {resolveVerticalEquationPresentation, verticalEquationPresentationLabels, verticalEquationPresentationRule} from '../arithmetic-equation-presentation.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical-inversion',
    compatibility: [
        verticalEquationPresentationRule,
        rejectTargetLabels('inversion-property-boundary', [
            ...deductAdmitting([
                Area.CommutativeLaw,
                Area.AssociativeLaw,
                Area.DistributiveLaw
            ])
        ])
    ],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ]
};

export const OperationsVerticalInversionViewSchema = {
    presentation: [verticalEquationPresentationLabels, resolveVerticalEquationPresentation,
        [[], [Area.Equation, Scope.ExpressionOnOneSide], [Area.Equation, Scope.ExpressionOnBothSides]]]
} as const;
export type OperationsVerticalInversionViewConfig = ConfigFromSchema<
    typeof OperationsVerticalInversionViewSchema
>;
