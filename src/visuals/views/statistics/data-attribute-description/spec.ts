import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';
import {attributeDescriptionEvidence} from '../data-context-view-policy.ts';

export const spec: ViewSpec = {viewId: 'data-attribute-description', generalLabels: [Ability.InformationExtraction, Ability.TextualArticulation], compatibility: [
    requireTargetLabels('attribute-description-original-task', [Area.StatisticalVariable, Ability.InformationExtraction, Ability.TextualArticulation]), attributeDescriptionEvidence
]};
export const DataAttributeDescriptionViewSchema = {} as const;
export type DataAttributeDescriptionViewConfig = ConfigFromSchema<typeof DataAttributeDescriptionViewSchema>;
