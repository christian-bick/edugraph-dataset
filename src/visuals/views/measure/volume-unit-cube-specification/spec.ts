import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'volume-unit-cube-specification',
    generalLabels: [Ability.ConceptSpecification]
};

export const VolumeUnitCubeSpecificationViewSchema = {} as const;
export type VolumeUnitCubeSpecificationViewConfig = ConfigFromSchema<
    typeof VolumeUnitCubeSpecificationViewSchema
>;
