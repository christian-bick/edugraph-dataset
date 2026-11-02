import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';
import {selectionCountingRangeSchema} from '../canonical-counting-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-selection',
    generalLabels: [...countingQuantityLabels, Scope.NumbersWithoutZero]
};

export const CountingSelectionGeneratorSchema = {...countingQuantitySchema, range: selectionCountingRangeSchema} as const;

export type CountingSelectionGeneratorConfig = ConfigFromSchema<typeof CountingSelectionGeneratorSchema>;
