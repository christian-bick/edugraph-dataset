import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-compose-shapes-construction',
    generalLabels: [Ability.SpatialGeneration]
};

export const ShapeComposeShapesConstructionViewSchema = {} as const;
export type ShapeComposeShapesConstructionViewConfig = ConfigFromSchema<typeof ShapeComposeShapesConstructionViewSchema>;
