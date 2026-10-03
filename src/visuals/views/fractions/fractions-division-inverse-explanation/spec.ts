import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-inverse-explanation',
    generalLabels: [Ability.ProcedureUnderstanding]
};

export const FractionsDivisionInverseExplanationViewSchema = {} as const;
export type FractionsDivisionInverseExplanationViewConfig = ConfigFromSchema<typeof FractionsDivisionInverseExplanationViewSchema>;
