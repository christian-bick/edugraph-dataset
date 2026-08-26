import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes-inversion',
    rejectedLabels: [
        ...deductAdmitting([
            Area.CommutativeLaw,
            Area.AssociativeLaw,
            Area.DistributiveLaw
        ])
    ],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.Formalization,
        Ability.ProcedureInversion,
        Area.Equation,
        Scope.ExpressionOnOneSide
    ]
};

export const OperationsBoxesInversionViewSchema = {} as const;
export type OperationsBoxesInversionViewConfig = ConfigFromSchema<
    typeof OperationsBoxesInversionViewSchema
>;
