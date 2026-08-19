import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-naming',
    generalLabels: [
        Area.ShapeRecognition,
        Area.ShapeRotationConservation,
        Area.ShapeResizingConservation,
        Ability.VisualRecognition
    ]
};

export const ShapeNamingViewSchema = {} as const;

export type ShapeNamingViewConfig = ConfigFromSchema<typeof ShapeNamingViewSchema>;
