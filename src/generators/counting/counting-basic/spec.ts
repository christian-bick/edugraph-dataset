import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';
import {enumerationCountingRangeSchema} from '../basic-counting-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-basic',
    generalLabels: countingQuantityLabels
};


export const CountingBasicGeneratorSchema = {...countingQuantitySchema, range: enumerationCountingRangeSchema} as const;

export type CountingBasicGeneratorConfig = ConfigFromSchema<typeof CountingBasicGeneratorSchema>;
