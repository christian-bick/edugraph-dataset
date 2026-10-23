import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {observationCountEvidence} from '../data-context-view-policy.ts';

export const spec: ViewSpec = {viewId: 'data-observation-count', generalLabels: [Ability.ProcedureExecution], compatibility: [
    requireTargetLabels('observation-count-original-task', [Area.StatisticalSample, Area.NumerationWithIntegers, Scope.QuantityMeasurement, Ability.ProcedureExecution]), observationCountEvidence
]};
export const DataObservationCountViewSchema = {} as const;
export type DataObservationCountViewConfig = ConfigFromSchema<typeof DataObservationCountViewSchema>;
