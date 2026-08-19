import {Ability} from 'edugraph-ts'; import {ConfigFromSchema} from '../../../../types/schema.ts'; import {ViewSpec} from '../../../../types/view-spec.ts';
export const spec: ViewSpec = {viewId: 'shape-partition-fraction-interpretation', generalLabels: [Ability.Interpretation]};
export const ShapePartitionFractionInterpretationViewSchema = {} as const; export type ShapePartitionFractionInterpretationViewConfig = ConfigFromSchema<typeof ShapePartitionFractionInterpretationViewSchema>;
