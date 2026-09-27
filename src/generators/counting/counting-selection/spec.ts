import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-selection',
    generalLabels: countingQuantityLabels
};

export const CountingSelectionGeneratorSchema = countingQuantitySchema;

export type CountingSelectionGeneratorConfig = ConfigFromSchema<typeof CountingSelectionGeneratorSchema>;
