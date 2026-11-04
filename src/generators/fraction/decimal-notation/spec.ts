import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {decimalNotationRangeChoices, decimalNotationRangeLabels, resolveDecimalNotationRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-notation',
    generalLabels: [
        Area.DecimalNotation,
        Scope.DecimalNumbers,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalNotationGeneratorSchema = {
    range: [decimalNotationRangeLabels, resolveDecimalNotationRange, decimalNotationRangeChoices]
} as const;

export type DecimalNotationGeneratorConfig = ConfigFromSchema<
    typeof DecimalNotationGeneratorSchema
>;
