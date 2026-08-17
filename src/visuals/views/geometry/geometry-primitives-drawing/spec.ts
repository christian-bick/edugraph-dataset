import {Ability, Area} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-primitives-drawing',
    generalLabels: [Ability.VisualArticulation]
};

export const GeometryPrimitivesDrawingViewSchema = {
    usesLinearDrawing: [
        [Area.LinearDrawing],
        hasLabel(Area.LinearDrawing)
    ]
} as const;

export type GeometryPrimitivesDrawingViewConfig = ConfigFromSchema<
    typeof GeometryPrimitivesDrawingViewSchema
>;
