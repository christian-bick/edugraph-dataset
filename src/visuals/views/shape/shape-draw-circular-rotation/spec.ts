import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-circular-rotation',
    generalLabels: [Area.CircularShapeDrawing, Area.ShapeRotationConservation, Ability.ConceptSpecification, Ability.VisualArticulation],
    requiredLabels: [Area.ShapeRotationConservation]
};
export const ShapeDrawCircularRotationViewSchema = {} as const;
export type ShapeDrawCircularRotationViewConfig = ConfigFromSchema<typeof ShapeDrawCircularRotationViewSchema>;
