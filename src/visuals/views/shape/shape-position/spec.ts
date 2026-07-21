import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-position',
    generalLabels: [
        Ability.SpatialInterpretation
    ]
};


export const ShapePositionViewSchema = {} as const;

export type ShapePositionViewConfig = ConfigFromSchema<typeof ShapePositionViewSchema>;
