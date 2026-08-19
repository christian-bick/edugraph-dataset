import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-equal',
    generalLabels: [Ability.VisualArticulation]
};

export const ShapePartitionEqualViewSchema = {} as const;

export type ShapePartitionEqualViewConfig = ConfigFromSchema<typeof ShapePartitionEqualViewSchema>;
