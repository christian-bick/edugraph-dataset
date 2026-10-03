import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-expanded-form',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization]
};

export const NumbersDecimalExpandedFormViewSchema = {} as const;
export type NumbersDecimalExpandedFormViewConfig = ConfigFromSchema<
    typeof NumbersDecimalExpandedFormViewSchema
>;
