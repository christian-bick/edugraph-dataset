import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-benchmark-reasonableness',
    generalLabels: [Ability.PlausibilityEvaluation]
};

export const FractionsBenchmarkReasonablenessViewSchema = {} as const;
export type FractionsBenchmarkReasonablenessViewConfig = ConfigFromSchema<typeof FractionsBenchmarkReasonablenessViewSchema>;
