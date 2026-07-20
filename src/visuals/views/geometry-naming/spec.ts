import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-naming',
    supportedLabels: [
        Ability.VisualRecognition
    ]
};


export const GeometryNamingViewSchema = {} as const;

export type GeometryNamingViewConfig = ConfigFromSchema<typeof GeometryNamingViewSchema>;
