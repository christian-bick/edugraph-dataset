import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {extractFirstMatch} from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-build-shape',
    supportedLabels: [
        Area.Triangle,
        Area.Square,
        Area.Rectangle,
        Area.Hexagon,
        Ability.VisualArticulation
    ],
};

export const GeometryBuildShapeGeneralLabels = [
    Ability.VisualArticulation
];

export const GeometryBuildShapeViewSchema = {
    targetShape: [
        [Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon], // TODO: Consider ontological relations to deduct compatible shapes if applicable
        extractFirstMatch([Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon], Area.Triangle)
    ]
} as const;

export type GeometryBuildShapeViewConfig = ConfigFromSchema<typeof GeometryBuildShapeViewSchema>;
