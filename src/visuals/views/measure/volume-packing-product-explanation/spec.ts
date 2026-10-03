import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-packing-product-explanation',
    generalLabels: [Ability.ProcedureUnderstanding, Ability.Formalization]
};

export const VolumePackingProductExplanationViewSchema = {} as const;
export type VolumePackingProductExplanationViewConfig = ConfigFromSchema<
    typeof VolumePackingProductExplanationViewSchema
>;
