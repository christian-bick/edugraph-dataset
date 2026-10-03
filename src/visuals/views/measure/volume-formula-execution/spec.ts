import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-formula-execution',
    generalLabels: [Ability.ProcedureExecution]
};

export const VolumeFormulaExecutionViewSchema = {} as const;
export type VolumeFormulaExecutionViewConfig = ConfigFromSchema<typeof VolumeFormulaExecutionViewSchema>;
