import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {distributionDescriptionEvidence} from '../numerical-distribution-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'distribution-description',
    generalLabels: [Ability.Interpretation],
    compatibility: [requireTargetLabels('distribution-description-original-task', [Area.EmpiricalDistributionShape, Area.StatisticalVariability]), distributionDescriptionEvidence]
};
export const DistributionDescriptionViewSchema = {} as const;
export type DistributionDescriptionViewConfig = ConfigFromSchema<typeof DistributionDescriptionViewSchema>;
