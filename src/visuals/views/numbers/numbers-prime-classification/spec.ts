import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-prime-classification',
    generalLabels: [Ability.ConceptClassification]
};

export const NumbersPrimeClassificationViewSchema = {} as const;
export type NumbersPrimeClassificationViewConfig = ConfigFromSchema<
    typeof NumbersPrimeClassificationViewSchema
>;
