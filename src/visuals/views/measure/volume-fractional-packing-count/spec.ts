import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-fractional-packing-count',
    generalLabels: [Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('fractional-prism-count-request', [Area.MeasuringVolumes, Scope.CubeScale])]
};
export const VolumeFractionalPackingCountViewSchema = {} as const;
export type VolumeFractionalPackingCountViewConfig = ConfigFromSchema<typeof VolumeFractionalPackingCountViewSchema>;
