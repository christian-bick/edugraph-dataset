import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-order-versus-magnitude',
    generalLabels: [Ability.ConceptClassification],
    compatibility: [requireTargetLabels('numbers-order-versus-magnitude-task', [Ability.ConceptClassification])]
};
export const NumbersOrderVersusMagnitudeViewSchema = {} as const;
export type NumbersOrderVersusMagnitudeViewConfig = ConfigFromSchema<typeof NumbersOrderVersusMagnitudeViewSchema>;
