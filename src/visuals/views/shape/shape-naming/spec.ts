import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import {hasLabel} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'shape-naming',
    generalLabels: [
        Ability.VisualRecognition
    ]
};


export const ShapeNamingViewSchema = {
    showAttributes: [[Scope.ShapeAttributes], hasLabel(Scope.ShapeAttributes)]
} as const;

export type ShapeNamingViewConfig = ConfigFromSchema<typeof ShapeNamingViewSchema>;
