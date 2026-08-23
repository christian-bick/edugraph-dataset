import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-to-decimal',
    generalLabels: [
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.Formalization
    ]
};

export const NumbersFractionToDecimalViewSchema = {} as const;

export type NumbersFractionToDecimalViewConfig = ConfigFromSchema<
    typeof NumbersFractionToDecimalViewSchema
>;
