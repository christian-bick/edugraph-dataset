import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-model',
    // A range capped below ten is a grouping/counting task, not a two-operand
    // place-value operation; this boundary prevents ten-bundle targets from matching.
    compatibility: [
        rejectTargetLabels('multi-digit-task-domain', [Scope.NumbersSmaller10])
    ],
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueArithmeticModelViewSchema = {} as const;

export type PlaceValueArithmeticModelViewConfig = ConfigFromSchema<typeof PlaceValueArithmeticModelViewSchema>;
