import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-product-model',
    generalLabels: [Ability.VisualArticulation]
};

export const VolumeProductModelViewSchema = {} as const;
export type VolumeProductModelViewConfig = ConfigFromSchema<typeof VolumeProductModelViewSchema>;
