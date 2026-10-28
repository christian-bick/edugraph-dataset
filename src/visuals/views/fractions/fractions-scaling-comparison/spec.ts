import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-scaling-comparison',
    generalLabels: [Ability.Interpretation, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const FractionsScalingComparisonViewSchema = {} as const;
export type FractionsScalingComparisonViewConfig = ConfigFromSchema<typeof FractionsScalingComparisonViewSchema>;
