import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-full-common-factor',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('operations-full-common-factor-task', [Area.GreatestCommonDivisor, Area.DistributiveLaw])]
};
export const OperationsFullCommonFactorViewSchema = {} as const;
export type OperationsFullCommonFactorViewConfig = ConfigFromSchema<typeof OperationsFullCommonFactorViewSchema>;
