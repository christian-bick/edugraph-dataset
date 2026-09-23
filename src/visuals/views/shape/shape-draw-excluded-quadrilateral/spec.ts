import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-excluded-quadrilateral',
    generalLabels: [Area.LinearShapeDrawing, Ability.ConceptSpecification, Ability.VisualArticulation]
};
export const ShapeDrawExcludedQuadrilateralViewSchema = {} as const;
export type ShapeDrawExcludedQuadrilateralViewConfig = ConfigFromSchema<typeof ShapeDrawExcludedQuadrilateralViewSchema>;
