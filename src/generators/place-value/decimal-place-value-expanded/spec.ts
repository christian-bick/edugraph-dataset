import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {expandedRangeLabels, resolveExpandedRange} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-expanded',
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const DecimalPlaceValueExpandedGeneratorSchema = {
    range: [expandedRangeLabels, resolveExpandedRange, expandedRangeLabels.map(label => [label])]
} as const;

export type DecimalPlaceValueExpandedGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueExpandedGeneratorSchema
>;
