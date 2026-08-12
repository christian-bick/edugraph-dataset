import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-arithmetic-explanation',
    rejectedLabels: [Scope.PhysicalNumbers],
    generalLabels: [
        Ability.TextualArticulation,
        Ability.ProcedureUnderstanding
    ]
};

export const PlaceValueArithmeticExplanationViewSchema = {} as const;
export type PlaceValueArithmeticExplanationViewConfig = ConfigFromSchema<typeof PlaceValueArithmeticExplanationViewSchema>;
