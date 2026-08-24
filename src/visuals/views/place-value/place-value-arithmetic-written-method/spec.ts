import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-written-method',
    rejectedLabels: [Scope.NumbersSmaller10],
    requiredLabels: [Ability.Formalization],
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
