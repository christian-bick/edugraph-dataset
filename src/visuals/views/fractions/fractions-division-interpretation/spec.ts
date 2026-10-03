import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-interpretation',
    generalLabels: [Ability.Interpretation]
};

export const FractionsDivisionInterpretationViewSchema = {} as const;
export type FractionsDivisionInterpretationViewConfig = ConfigFromSchema<typeof FractionsDivisionInterpretationViewSchema>;
