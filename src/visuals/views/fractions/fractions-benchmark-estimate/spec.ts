import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-benchmark-estimate',
    generalLabels: [Ability.ProcedureExecution]
};

export const FractionsBenchmarkEstimateViewSchema = {} as const;
export type FractionsBenchmarkEstimateViewConfig = ConfigFromSchema<typeof FractionsBenchmarkEstimateViewSchema>;
