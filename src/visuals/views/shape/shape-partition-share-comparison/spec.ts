import {Ability} from 'edugraph-ts'; import {ConfigFromSchema} from '../../../../types/schema.ts'; import {ViewSpec} from '../../../../types/view-spec.ts';
export const spec: ViewSpec = {viewId: 'shape-partition-share-comparison', generalLabels: [Ability.ConceptDerivation]};
export const ShapePartitionShareComparisonViewSchema = {} as const; export type ShapePartitionShareComparisonViewConfig = ConfigFromSchema<typeof ShapePartitionShareComparisonViewSchema>;
