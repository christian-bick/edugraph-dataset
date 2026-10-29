import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-numeral-reading',
    compatibility: [{
        id: 'decimal-reading-source-notation',
        dependencies: [{scope: 'generator', label: Area.DecimalNotation}],
        predicate: labels => labels.exact('generator', Area.DecimalNotation)
    }],
    generalLabels: [Scope.ArabicNumerals, Ability.TextualReception]
};

export const NumbersDecimalNumeralReadingViewSchema = {} as const;
export type NumbersDecimalNumeralReadingViewConfig = ConfigFromSchema<
    typeof NumbersDecimalNumeralReadingViewSchema
>;
