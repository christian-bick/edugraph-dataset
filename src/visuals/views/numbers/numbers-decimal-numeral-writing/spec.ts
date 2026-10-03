import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-numeral-writing',
    generalLabels: [Scope.ArabicNumerals, Ability.VisualArticulation]
};

export const NumbersDecimalNumeralWritingViewSchema = {} as const;
export type NumbersDecimalNumeralWritingViewConfig = ConfigFromSchema<
    typeof NumbersDecimalNumeralWritingViewSchema
>;
