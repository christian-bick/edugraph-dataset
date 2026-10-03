import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-numeral-reading',
    generalLabels: [Scope.ArabicNumerals, Ability.TextualReception]
};

export const NumbersDecimalNumeralReadingViewSchema = {} as const;
export type NumbersDecimalNumeralReadingViewConfig = ConfigFromSchema<
    typeof NumbersDecimalNumeralReadingViewSchema
>;
