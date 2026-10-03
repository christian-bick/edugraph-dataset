import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-additivity-explanation',
    generalLabels: [Ability.ProcedureUnderstanding]
};

export const VolumeAdditivityExplanationViewSchema = {} as const;
export type VolumeAdditivityExplanationViewConfig = ConfigFromSchema<
    typeof VolumeAdditivityExplanationViewSchema
>;
