import {Ability, Area, Scope} from 'edugraph-ts';
import {selectCanonicalLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-notation',
    generalLabels: [
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers
    ]
};

export const NumbersDecimalNotationViewSchema = {
    conversionDirection: [
        [Ability.Formalization, Ability.Interpretation],
        selectCanonicalLabel([
            [[Ability.Formalization], 'fraction-to-decimal'],
            [[Ability.Interpretation], 'decimal-to-fraction']
        ])
    ]
} as const;

export type NumbersDecimalNotationViewConfig = ConfigFromSchema<
    typeof NumbersDecimalNotationViewSchema
>;
