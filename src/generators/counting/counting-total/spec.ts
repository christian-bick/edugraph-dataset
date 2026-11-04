import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {totalCountingRangeSchema} from '../basic-counting-profile.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-total',
    generalLabels: countingQuantityLabels
};

export const CountingTotalGeneratorSchema = {...countingQuantitySchema, range: totalCountingRangeSchema} as const;
export type CountingTotalGeneratorConfig = ConfigFromSchema<typeof CountingTotalGeneratorSchema>;
