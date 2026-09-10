import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-share-name',
    generalLabels: [Area.NumberNameNotation, Ability.ActiveVocabulary]
};

export const ShapePartitionShareNameViewSchema = {} as const;
export type ShapePartitionShareNameViewConfig = ConfigFromSchema<typeof ShapePartitionShareNameViewSchema>;
