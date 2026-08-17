import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-multiplicative-comparison',
    generalLabels: [
        Area.Equation,
        Scope.ArabicNumerals,
        Ability.Interpretation
    ]
};

export const OperationsMultiplicativeComparisonViewSchema = {} as const;

export type OperationsMultiplicativeComparisonViewConfig = ConfigFromSchema<
    typeof OperationsMultiplicativeComparisonViewSchema
>;
