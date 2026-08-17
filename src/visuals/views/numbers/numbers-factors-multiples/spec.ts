import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-factors-multiples',
    generalLabels: []
};

export const NumbersFactorsMultiplesViewSchema = {} as const;

export type NumbersFactorsMultiplesViewConfig = ConfigFromSchema<
    typeof NumbersFactorsMultiplesViewSchema
>;
