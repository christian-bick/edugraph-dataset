import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-model',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding,
        Scope.ArabicNumerals
    ]
};

export const PlaceValueArithmeticModelViewSchema = {} as const;

export type PlaceValueArithmeticModelViewConfig = ConfigFromSchema<typeof PlaceValueArithmeticModelViewSchema>;
