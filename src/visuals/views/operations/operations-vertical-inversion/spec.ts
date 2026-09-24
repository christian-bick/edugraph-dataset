import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical-inversion',
    compatibility: [
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

export const OperationsVerticalInversionViewSchema = {} as const;
export type OperationsVerticalInversionViewConfig = ConfigFromSchema<
    typeof OperationsVerticalInversionViewSchema
>;
