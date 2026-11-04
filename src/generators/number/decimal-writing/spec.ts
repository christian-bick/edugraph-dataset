import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {decimalValueRangeChoices, decimalValueRangeLabels, resolveDecimalValueRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-writing',
    generalLabels: [
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const DecimalWritingGeneratorSchema = {
    notationFamily: [Area.DecimalNotation, Area.NumberNameNotation],
    range: [decimalValueRangeLabels, resolveDecimalValueRange, decimalValueRangeChoices]
} as const;

export type DecimalWritingGeneratorConfig = ConfigFromSchema<
    typeof DecimalWritingGeneratorSchema
>;
