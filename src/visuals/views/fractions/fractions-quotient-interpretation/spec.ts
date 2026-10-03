import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-quotient-interpretation',
    generalLabels: [Area.FractionNotation, Ability.Interpretation],
    compatibility: [requireTargetLabels('fraction-quotient-notation-task', [Area.FractionNotation])]
};

export const FractionsQuotientInterpretationViewSchema = {} as const;
export type FractionsQuotientInterpretationViewConfig = ConfigFromSchema<typeof FractionsQuotientInterpretationViewSchema>;
