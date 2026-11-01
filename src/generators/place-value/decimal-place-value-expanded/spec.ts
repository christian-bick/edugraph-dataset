import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {expandedRangeLabels, expandedZeroLabels, resolveExpandedRange, resolveExpandedZero} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-place-value-expanded',
    compatibility: [generatorLabelRule('expanded-decimal-range', [...expandedRangeLabels, ...expandedZeroLabels], selected =>
        !selected(Scope.NumbersWithoutZero) || selected(Scope.NumbersSmaller120) || selected(Scope.NumbersSmaller1000))],
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.ThousandthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalPlaceValueExpandedGeneratorSchema = {
    requireZeroCoefficient: [
        expandedZeroLabels, resolveExpandedZero, expandedZeroLabels.map(label => [label])
    ],
    range: [expandedRangeLabels, resolveExpandedRange, expandedRangeLabels.map(label => [label])]
} as const;

export type DecimalPlaceValueExpandedGeneratorConfig = ConfigFromSchema<
    typeof DecimalPlaceValueExpandedGeneratorSchema
>;
