import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-env-shapes',
    generalLabels: [
        Ability.ProcedureExecution
    ],
};


export const ShapeEnvShapesViewSchema = {} as const;

export type ShapeEnvShapesViewConfig = ConfigFromSchema<typeof ShapeEnvShapesViewSchema>;
