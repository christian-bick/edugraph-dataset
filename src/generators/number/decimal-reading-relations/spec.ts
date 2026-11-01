import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {decimalWholeRangeCompatibility, decimalWholeRangeLabels, resolveDecimalWholeRange} from '../decimal-writing/range-profile.ts';
import {decimalZeroLabels, resolveDecimalZeroProfile} from '../decimal-writing/zero-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-reading-relations',
    compatibility: [decimalWholeRangeCompatibility],
    generalLabels: [Area.DecimalNotation, Scope.ThousandthDecimals, Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const DecimalReadingRelationsGeneratorSchema = {
    zeroProfile: [decimalZeroLabels, resolveDecimalZeroProfile, decimalZeroLabels.map(label => [label])],
    range: [decimalWholeRangeLabels, resolveDecimalWholeRange, decimalWholeRangeLabels.map(label => [label])]
} as const;
export type DecimalReadingRelationsGeneratorConfig = ConfigFromSchema<typeof DecimalReadingRelationsGeneratorSchema>;
