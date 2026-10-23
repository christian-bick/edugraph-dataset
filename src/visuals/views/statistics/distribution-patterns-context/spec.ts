import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {distributionPatternsEvidence} from '../numerical-distribution-view-policy.ts';

export const spec: ViewSpec = {
    viewId: 'distribution-patterns-context',
    generalLabels: [Ability.Interpretation],
    compatibility: [requireTargetLabels('distribution-patterns-original-task', [Area.EmpiricalDistributionShape, Area.StatisticalOutlier]), distributionPatternsEvidence]
};
export const DistributionPatternsContextViewSchema = {} as const;
export type DistributionPatternsContextViewConfig = ConfigFromSchema<typeof DistributionPatternsContextViewSchema>;
