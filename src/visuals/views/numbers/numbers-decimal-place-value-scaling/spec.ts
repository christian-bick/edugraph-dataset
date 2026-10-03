import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-place-value-scaling',
    generalLabels: [Ability.ConceptDerivation]
};

export const NumbersDecimalPlaceValueScalingViewSchema = {} as const;

export type NumbersDecimalPlaceValueScalingViewConfig = ConfigFromSchema<
    typeof NumbersDecimalPlaceValueScalingViewSchema
>;
