import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'place-value-scaling',
    generalLabels: [Ability.ConceptDerivation]
};

export const PlaceValueScalingViewSchema = {} as const;
export type PlaceValueScalingViewConfig = ConfigFromSchema<typeof PlaceValueScalingViewSchema>;
