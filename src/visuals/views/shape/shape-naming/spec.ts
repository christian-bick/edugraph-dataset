import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import {hasLabel} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'shape-naming',
    generalLabels: [
        Area.ShapeNaming,
        Ability.VisualRecognition
    ]
};

export const ShapeNamingViewSchema = {
    varyOrientation: [[Scope.ShapeOrientationVariation], hasLabel(Scope.ShapeOrientationVariation)],
    varySize: [[Scope.ShapeSizeVariation], hasLabel(Scope.ShapeSizeVariation)]
} as const;

export type ShapeNamingViewConfig = ConfigFromSchema<typeof ShapeNamingViewSchema>;
