import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-plot-pattern-pairs',
    generalLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation],
    compatibility: [
        requireTargetLabels('plot-pattern-pairs-request', [Area.PointPlotting])
    ]
};

export const CoordinatePlotPatternPairsViewSchema = {} as const;

export type CoordinatePlotPatternPairsViewConfig = ConfigFromSchema<typeof CoordinatePlotPatternPairsViewSchema>;
