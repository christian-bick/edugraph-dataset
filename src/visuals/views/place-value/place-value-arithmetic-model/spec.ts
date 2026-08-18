import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-model',
    // A range capped below ten is a grouping/counting task, not a two-operand
    // place-value operation; this boundary prevents ten-bundle targets from matching.
    rejectedLabels: [Scope.NumbersSmaller10],
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueArithmeticModelViewSchema = {
    showWrittenMethod: [
        [Ability.Formalization],
        hasLabel(Ability.Formalization)
    ]
} as const;

export type PlaceValueArithmeticModelViewConfig = ConfigFromSchema<typeof PlaceValueArithmeticModelViewSchema>;
