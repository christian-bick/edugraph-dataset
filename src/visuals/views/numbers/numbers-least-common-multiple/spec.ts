import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-least-common-multiple',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('numbers-least-common-multiple-task', [Area.LeastCommonMultiple])]
};
export const NumbersLeastCommonMultipleViewSchema = {} as const;
export type NumbersLeastCommonMultipleViewConfig = ConfigFromSchema<typeof NumbersLeastCommonMultipleViewSchema>;
