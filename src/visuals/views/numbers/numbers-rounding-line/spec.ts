import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-rounding-line',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
    compatibility: [
        rejectTargetLabels('nonnegative-rounding-domain', [
            ...deductAdmitting([Scope.NumbersWithNegatives])
        ])
    ]
};

export const NumbersRoundingLineViewSchema = {} as const;

export type NumbersRoundingLineViewConfig = ConfigFromSchema<
    typeof NumbersRoundingLineViewSchema
>;
