import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-compose-teen',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const PlaceValueComposeTeenViewSchema = {} as const;

export type PlaceValueComposeTeenViewConfig = ConfigFromSchema<typeof PlaceValueComposeTeenViewSchema>;
