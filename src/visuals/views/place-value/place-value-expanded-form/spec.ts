import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-expanded-form',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.Formalization
    ]
};

export const PlaceValueExpandedFormViewSchema = {} as const;

export type PlaceValueExpandedFormViewConfig = ConfigFromSchema<typeof PlaceValueExpandedFormViewSchema>;
