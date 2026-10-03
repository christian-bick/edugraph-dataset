import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-composite-execution',
    generalLabels: [Ability.ProcedureExecution]
};

export const VolumeCompositeExecutionViewSchema = {} as const;
export type VolumeCompositeExecutionViewConfig = ConfigFromSchema<typeof VolumeCompositeExecutionViewSchema>;
