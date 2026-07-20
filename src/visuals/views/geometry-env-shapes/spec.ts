import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-env-shapes',
    generalLabels: [
        Area.Circle,
        Area.Triangle,
        Ability.ProcedureExecution
    ],
};


export const GeometryEnvShapesViewSchema = {} as const;

export type GeometryEnvShapesViewConfig = ConfigFromSchema<typeof GeometryEnvShapesViewSchema>;
