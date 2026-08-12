import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-model',
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
