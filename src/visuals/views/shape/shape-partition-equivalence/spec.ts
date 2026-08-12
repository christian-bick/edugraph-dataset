import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-equivalence',
    generalLabels: []
};

export const ShapePartitionEquivalenceViewSchema = {} as const;

export type ShapePartitionEquivalenceViewConfig = ConfigFromSchema<
    typeof ShapePartitionEquivalenceViewSchema
>;
