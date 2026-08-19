import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {hasLabel} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'shape-build-shape',
    generalLabels: [
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ],
};


export const ShapeBuildShapeViewSchema = {
    useGeometrySticks: [
        [Scope.GeometrySticks],
        hasLabel(Scope.GeometrySticks)
    ]
} as const;

export type ShapeBuildShapeViewConfig = ConfigFromSchema<typeof ShapeBuildShapeViewSchema>;
