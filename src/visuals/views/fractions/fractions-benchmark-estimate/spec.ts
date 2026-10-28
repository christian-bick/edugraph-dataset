import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-benchmark-estimate',
    generalLabels: [Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersWithZero]
};

export const FractionsBenchmarkEstimateViewSchema = {} as const;
export type FractionsBenchmarkEstimateViewConfig = ConfigFromSchema<typeof FractionsBenchmarkEstimateViewSchema>;
