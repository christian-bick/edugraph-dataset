import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-area-tiling-understanding',
    generalLabels: [Scope.BoxArrangement, Ability.ProcedureUnderstanding],
    compatibility: [requireTargetLabels('fractional-rectangle-tiling-scope', [Scope.FractionNumbers])]
};

export const FractionsAreaTilingUnderstandingViewSchema = {} as const;
export type FractionsAreaTilingUnderstandingViewConfig = ConfigFromSchema<typeof FractionsAreaTilingUnderstandingViewSchema>;
