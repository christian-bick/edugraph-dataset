import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {decimalValueRangeChoices, decimalValueRangeLabels, resolveDecimalValueRange} from '../decimal-writing/range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-reading-relations',
    generalLabels: [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const DecimalReadingRelationsGeneratorSchema = {
    range: [decimalValueRangeLabels, resolveDecimalValueRange, decimalValueRangeChoices]
} as const;
export type DecimalReadingRelationsGeneratorConfig = ConfigFromSchema<typeof DecimalReadingRelationsGeneratorSchema>;
