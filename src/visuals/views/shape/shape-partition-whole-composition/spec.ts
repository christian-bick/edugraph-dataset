import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-whole-composition',
    generalLabels: [Area.ShapeSynthesis, Ability.ConceptComposition]
};

export const ShapePartitionWholeCompositionViewSchema = {} as const;
export type ShapePartitionWholeCompositionViewConfig = ConfigFromSchema<typeof ShapePartitionWholeCompositionViewSchema>;
