import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-execution',
    generalLabels: [Ability.ProcedureExecution],
    requiredLabels: [Area.MeasuringWithUnits]
};

export const MeasureConversionExecutionViewSchema = {} as const;

export type MeasureConversionExecutionViewConfig = ConfigFromSchema<
    typeof MeasureConversionExecutionViewSchema
>;
