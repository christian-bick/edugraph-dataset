import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {roundingRangeChoices, roundingRangeLabels, roundingZeroLabels, resolveRoundingRange, resolveRoundingZero} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-rounding',
    compatibility: [generatorLabelRule('rounding-endpoint-range', [...roundingRangeLabels, ...roundingZeroLabels], selected =>
        !selected(Scope.NumbersWithZero) || ![Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger20].some(selected)
        && [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller100].some(selected))],
    generalLabels: [
        Area.DecimalRounding,
        Scope.DecimalNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const DecimalRoundingGeneratorSchema = {
    requireZeroEndpoint: [
        roundingZeroLabels, resolveRoundingZero, roundingZeroLabels.map(label => [label])
    ],
    range: [roundingRangeLabels, resolveRoundingRange, roundingRangeChoices]
} as const;

export type DecimalRoundingGeneratorConfig = ConfigFromSchema<typeof DecimalRoundingGeneratorSchema>;
