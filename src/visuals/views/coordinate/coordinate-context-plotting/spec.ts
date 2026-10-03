import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-context-plotting',
    generalLabels: [
        Area.PointPlotting,
        Scope.CartesianCoordinateSystem,
        Ability.VisualArticulation,
        Ability.TextualReception
    ]
};

export const CoordinateContextPlottingViewSchema = {} as const;
export type CoordinateContextPlottingViewConfig = ConfigFromSchema<typeof CoordinateContextPlottingViewSchema>;
