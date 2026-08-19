import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-prime-classification',
    generalLabels: [Ability.ConceptClassification],
    requiredLabels: [Area.PrimeNumbers]
};

export const NumbersPrimeClassificationViewSchema = {} as const;
export type NumbersPrimeClassificationViewConfig = ConfigFromSchema<
    typeof NumbersPrimeClassificationViewSchema
>;
