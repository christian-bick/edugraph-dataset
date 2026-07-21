import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-position',
    generalLabels: [
        Ability.SpatialInterpretation
    ]
};


export const GeometryPositionViewSchema = {} as const;

export type GeometryPositionViewConfig = ConfigFromSchema<typeof GeometryPositionViewSchema>;
