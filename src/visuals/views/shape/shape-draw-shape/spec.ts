import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-shape',
    generalLabels: [
        Area.LinearShapeDrawing,
        Area.CircularShapeDrawing,
        Ability.VisualArticulation
    ],
    rejectedLabels: [Area.Hexagon, Scope.VertexCount, Scope.FaceCount]
};


export const ShapeDrawShapeViewSchema = {} as const;

export type ShapeDrawShapeViewConfig = ConfigFromSchema<typeof ShapeDrawShapeViewSchema>;
