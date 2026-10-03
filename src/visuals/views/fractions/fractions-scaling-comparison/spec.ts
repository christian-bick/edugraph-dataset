import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-scaling-comparison',
    generalLabels: [Ability.Interpretation]
};

export const FractionsScalingComparisonViewSchema = {} as const;
export type FractionsScalingComparisonViewConfig = ConfigFromSchema<typeof FractionsScalingComparisonViewSchema>;
