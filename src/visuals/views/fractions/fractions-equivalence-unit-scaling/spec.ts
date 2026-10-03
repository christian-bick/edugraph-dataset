import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-equivalence-unit-scaling',
    generalLabels: [Ability.Interpretation],
    compatibility: [
        requireTargetLabels('fraction-unit-scaling-request', [Area.ProportionalScaling])
    ]
};

export const FractionsEquivalenceUnitScalingViewSchema = {} as const;
export type FractionsEquivalenceUnitScalingViewConfig = ConfigFromSchema<
    typeof FractionsEquivalenceUnitScalingViewSchema
>;
