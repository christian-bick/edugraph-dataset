import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {boxedEquationShapeLabels, boxedEquationShapeRule, resolveBoxedEquationShape} from '../arithmetic-equation-presentation.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes-inversion',
    compatibility: [
        boxedEquationShapeRule,
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
        Ability.ProcedureInversion,
        Area.Equation
    ]
};

export const OperationsBoxesInversionViewSchema = {
    equationShape: [boxedEquationShapeLabels, resolveBoxedEquationShape,
        boxedEquationShapeLabels.map(label => [label])]
} as const;
export type OperationsBoxesInversionViewConfig = ConfigFromSchema<
    typeof OperationsBoxesInversionViewSchema
>;
