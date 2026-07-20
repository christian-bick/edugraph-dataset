import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-draw-shape',
    supportedLabels: [
        Area.ShapePlotting,
        Ability.VisualArticulation
    ],
};


export const GeometryDrawShapeViewSchema = {} as const;

export type GeometryDrawShapeViewConfig = ConfigFromSchema<typeof GeometryDrawShapeViewSchema>;
