import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-naming',
    generalLabels: [
        Ability.VisualRecognition
    ]
};


export const ShapeNamingViewSchema = {} as const;

export type ShapeNamingViewConfig = ConfigFromSchema<typeof ShapeNamingViewSchema>;
