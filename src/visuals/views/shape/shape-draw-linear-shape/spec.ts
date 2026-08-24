import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-linear-shape',
    requiredLabels: [Area.Polygon],
    generalLabels: [
        Area.LinearShapeDrawing,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ],
    rejectedLabels: [
        Area.Hexagon,
        Area.Pentagon,
        Scope.ShapeProperties,
        Scope.VertexCount,
        Scope.AngleCount,
        Scope.FaceCount
    ]
};

export const ShapeDrawLinearShapeViewSchema = {} as const;

export type ShapeDrawLinearShapeViewConfig = ConfigFromSchema<typeof ShapeDrawLinearShapeViewSchema>;
