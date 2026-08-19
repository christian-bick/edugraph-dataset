import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'area-rectilinear-decomposition',
    generalLabels: [Ability.VisualDecomposition, Ability.ProcedureExecution]
};

export const AreaRectilinearDecompositionViewSchema = {} as const;

export type AreaRectilinearDecompositionViewConfig = ConfigFromSchema<
    typeof AreaRectilinearDecompositionViewSchema
>;
