import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-to-fraction',
    generalLabels: [
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.Interpretation
    ]
};

export const NumbersDecimalToFractionViewSchema = {} as const;

export type NumbersDecimalToFractionViewConfig = ConfigFromSchema<
    typeof NumbersDecimalToFractionViewSchema
>;
