import {rejectTargetLabels, requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-written-method',
    compatibility: [
        rejectTargetLabels('multi-digit-task-domain', [Scope.NumbersSmaller10]),
        requireTargetLabels('formalization-request', [Ability.Formalization])
    ],
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ]
};

export const PlaceValueArithmeticWrittenMethodViewSchema = {} as const;
export type PlaceValueArithmeticWrittenMethodViewConfig = ConfigFromSchema<
    typeof PlaceValueArithmeticWrittenMethodViewSchema
>;
