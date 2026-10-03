import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-packing-interpretation',
    generalLabels: [Ability.Interpretation]
};

export const VolumePackingInterpretationViewSchema = {} as const;
export type VolumePackingInterpretationViewConfig = ConfigFromSchema<
    typeof VolumePackingInterpretationViewSchema
>;
