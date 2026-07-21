import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-shape',
    generalLabels: [
        Area.ShapePlotting,
        Ability.VisualArticulation
    ],
};


export const ShapeDrawShapeViewSchema = {} as const;

export type ShapeDrawShapeViewConfig = ConfigFromSchema<typeof ShapeDrawShapeViewSchema>;
