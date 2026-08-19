import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
export const spec: ViewSpec = {
    viewId: 'shape-partition-unit-fraction',
    generalLabels: [Ability.VisualArticulation, Ability.Formalization]
};
export const ShapePartitionUnitFractionViewSchema = {} as const;
export type ShapePartitionUnitFractionViewConfig = ConfigFromSchema<typeof ShapePartitionUnitFractionViewSchema>;
