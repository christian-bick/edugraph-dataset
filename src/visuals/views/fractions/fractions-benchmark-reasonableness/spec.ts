import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-benchmark-reasonableness',
    generalLabels: [Ability.PlausibilityEvaluation, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersWithZero]
};

export const FractionsBenchmarkReasonablenessViewSchema = {} as const;
export type FractionsBenchmarkReasonablenessViewConfig = ConfigFromSchema<typeof FractionsBenchmarkReasonablenessViewSchema>;
