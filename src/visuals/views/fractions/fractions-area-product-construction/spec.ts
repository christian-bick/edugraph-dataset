import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-area-product-construction',
    generalLabels: [Ability.VisualArticulation],
    compatibility: [requireTargetLabels('fractional-rectangle-construction-scope', [Scope.FractionNumbers])]
};

export const FractionsAreaProductConstructionViewSchema = {} as const;
export type FractionsAreaProductConstructionViewConfig = ConfigFromSchema<typeof FractionsAreaProductConstructionViewSchema>;
