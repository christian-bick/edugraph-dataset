import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-power-ten-exponent-notation',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization]
};

export const NumbersPowerTenExponentNotationViewSchema = {} as const;
export type NumbersPowerTenExponentNotationViewConfig = ConfigFromSchema<
    typeof NumbersPowerTenExponentNotationViewSchema
>;
