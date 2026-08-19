import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'data-picture-graph-arithmetic',
    generalLabels: [Scope.PictureGraph, Ability.ProcedureExecution],
    rejectedLabels: [Scope.SingleStep, Scope.MultiStep]
};
export const DataPictureGraphArithmeticViewSchema = {} as const;
export type DataPictureGraphArithmeticViewConfig = ConfigFromSchema<typeof DataPictureGraphArithmeticViewSchema>;
