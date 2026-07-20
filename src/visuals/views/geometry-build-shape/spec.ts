import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-build-shape',
    generalLabels: [
        Ability.VisualArticulation
    ],
};


export const GeometryBuildShapeViewSchema = {
    targetShape: [
        [Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon], // TODO: Consider ontological relations to deduct compatible shapes if applicable
        selectExactMatch
    ]
} as const;

export type GeometryBuildShapeViewConfig = ConfigFromSchema<typeof GeometryBuildShapeViewSchema>;
