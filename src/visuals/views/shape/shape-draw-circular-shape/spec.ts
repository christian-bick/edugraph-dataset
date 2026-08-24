import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-circular-shape',
    requiredLabels: [Area.Circle],
    generalLabels: [
        Area.CircularShapeDrawing,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ],
    rejectedLabels: [
        Scope.ShapeProperties,
        Scope.VertexCount,
        Scope.AngleCount,
        Scope.FaceCount
    ]
};

export const ShapeDrawCircularShapeViewSchema = {} as const;

export type ShapeDrawCircularShapeViewConfig = ConfigFromSchema<typeof ShapeDrawCircularShapeViewSchema>;
