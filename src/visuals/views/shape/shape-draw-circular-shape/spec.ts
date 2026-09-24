import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-draw-circular-shape',
    compatibility: [
        requireTargetLabels('shape-classification-request', [Area.ShapeClassification])
    ],
    generalLabels: [
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Area.CircularShapeDrawing,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ]
};

export const ShapeDrawCircularShapeViewSchema = {} as const;

export type ShapeDrawCircularShapeViewConfig = ConfigFromSchema<typeof ShapeDrawCircularShapeViewSchema>;
