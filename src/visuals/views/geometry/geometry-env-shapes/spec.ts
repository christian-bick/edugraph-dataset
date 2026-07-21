import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-env-shapes',
    generalLabels: [
        Ability.ProcedureExecution
    ],
};


export const GeometryEnvShapesViewSchema = {} as const;

export type GeometryEnvShapesViewConfig = ConfigFromSchema<typeof GeometryEnvShapesViewSchema>;
