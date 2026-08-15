import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'area-distributive-model',
    generalLabels: [Ability.ProcedureUnderstanding]
};

export const AreaDistributiveModelViewSchema = {} as const;

export type AreaDistributiveModelViewConfig = ConfigFromSchema<
    typeof AreaDistributiveModelViewSchema
>;
