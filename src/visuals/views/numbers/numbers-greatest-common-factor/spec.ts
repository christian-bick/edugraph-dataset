import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-greatest-common-factor',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('numbers-greatest-common-factor-task', [Area.GreatestCommonDivisor])]
};
export const NumbersGreatestCommonFactorViewSchema = {} as const;
export type NumbersGreatestCommonFactorViewConfig = ConfigFromSchema<typeof NumbersGreatestCommonFactorViewSchema>;
