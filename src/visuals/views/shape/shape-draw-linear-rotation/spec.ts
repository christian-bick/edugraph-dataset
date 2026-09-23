import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-linear-rotation',
    generalLabels: [Area.LinearShapeDrawing, Area.ShapeRotationConservation, Ability.ConceptSpecification, Ability.VisualArticulation],
    requiredLabels: [Area.ShapeRotationConservation]
};
export const ShapeDrawLinearRotationViewSchema = {} as const;
export type ShapeDrawLinearRotationViewConfig = ConfigFromSchema<typeof ShapeDrawLinearRotationViewSchema>;
