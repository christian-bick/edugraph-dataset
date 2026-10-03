import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-unit-cube-count',
    generalLabels: [Ability.ProcedureExecution]
};

export const VolumeUnitCubeCountViewSchema = {} as const;
export type VolumeUnitCubeCountViewConfig = ConfigFromSchema<
    typeof VolumeUnitCubeCountViewSchema
>;
