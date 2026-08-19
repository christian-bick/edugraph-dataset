import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-drawing',
    generalLabels: [
        Scope.AngleMeasurement,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ]
};

export const GeometryAngleDrawingViewSchema = {} as const;

export type GeometryAngleDrawingViewConfig = ConfigFromSchema<
    typeof GeometryAngleDrawingViewSchema
>;
