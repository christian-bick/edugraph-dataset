import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {multiplicationDomain} from './domain.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

export type OperandDigitProfile =
    | 'one-by-one'
    | 'one-by-two'
    | 'one-by-three'
    | 'one-by-four'
    | 'two-by-two';

const operandDigitProfileFallbacks = [
    [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand],
    [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand],
    [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]
] as const;

const resolveOperandDigitProfile = selectExactLabelSetMap([
    [operandDigitProfileFallbacks[0], 'one-by-one'],
    [operandDigitProfileFallbacks[1], 'one-by-two'],
    [operandDigitProfileFallbacks[2], 'one-by-three'],
    [operandDigitProfileFallbacks[3], 'one-by-four'],
    [operandDigitProfileFallbacks[4], 'two-by-two']
] as const);

const profiles = ['one-by-one', 'one-by-two', 'one-by-three', 'one-by-four', 'two-by-two'] as const;
const contextLabels = [...new Set(operandDigitProfileFallbacks.flat())];
const permitsRange = (labels: string[], range: Parameters<typeof multiplicationDomain>[1]): boolean => {
    const selected = labels.filter(label => contextLabels.includes(label as never));
    if (!selected.length) return true;
    const index = operandDigitProfileFallbacks.findIndex(bundle => bundle.length === selected.length && bundle.every(label => selected.includes(label)));
    return index >= 0 && multiplicationDomain(profiles[index]!, range).length > 0;
};
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min)
    && profiles.some(profile => multiplicationDomain(profile, range).length > 0));
const rangeChoices = ranges.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices, contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'multi-digit-multiplication',
    compatibility: [generatorLabelRule('partial-products-canonical-band', [...contextLabels, ...rangeLabels], selected => {
        const labels = [...contextLabels, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })],
    generalLabels: [
        Area.MultiplicationPartialProducts,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

export const MultiDigitMultiplicationGeneratorSchema = {
    operandDigitProfile: [
        [
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitSmallestOperand,
            Scope.SingleDigitLargestOperand,
            Scope.TwoDigitLargestOperand,
            Scope.ThreeDigitLargestOperand,
            Scope.FourDigitLargestOperand
        ],
        resolveOperandDigitProfile,
        operandDigitProfileFallbacks
    ],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type MultiDigitMultiplicationGeneratorConfig = ConfigFromSchema<
    typeof MultiDigitMultiplicationGeneratorSchema
>;
