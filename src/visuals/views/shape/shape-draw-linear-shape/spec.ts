import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-linear-shape',
    requiredLabels: [Area.ShapeClassification],
    generalLabels: [
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Area.LinearShapeDrawing,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ]
};

export const ShapeDrawLinearShapeViewSchema = {} as const;

export type ShapeDrawLinearShapeViewConfig = ConfigFromSchema<typeof ShapeDrawLinearShapeViewSchema>;
