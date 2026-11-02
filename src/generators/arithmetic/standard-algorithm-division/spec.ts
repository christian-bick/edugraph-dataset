import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {type ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {standardDivisionProfileCount} from './domain.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const widths = [Scope.SingleDigitDivisor, Scope.TwoDigitDivisor, Scope.ThreeDigitDivisor];
const zeros = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const contextLabels = [...widths, ...zeros];
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 100000 && [0, 5].includes(range.min)
    && [1, 2, 3].some(width => [false, true].some(zero => standardDivisionProfileCount(width, zero, range) > 0)));
const rangeChoices = ranges.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const admittedProfiles = ranges.flatMap(profile => widths.flatMap((label, index) => zeros.flatMap((zeroLabel, zeroIndex) =>
    standardDivisionProfileCount(index + 1, zeroIndex === 0, profile.range) > 0
        ? [{...profile, width: index + 1, zero: zeroIndex === 0, labels: [...profile.labels, label, zeroLabel]}] : [])));
// Earlier providers consider later range requests, so direct resolution cannot select an empty branch.
const admitsRequest = (labels: string[]): boolean => admittedProfiles.some(profile =>
    [...rangeLabels, ...contextLabels].filter(label => labels.includes(label)).every(label => profile.labels.includes(label)));
const resolveDivisorDigits = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = widths.filter(label => labels.includes(label));
    return selected.length === 1 && admitsRequest(labels) ? widths.indexOf(selected[0]!) + 1 : undefined;
}), {kind: 'alternatives', alternatives: widths.map(label => [label]), contextLabels: [...rangeLabels, ...zeros]});
const resolveZeroOccurrence = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = zeros.filter(label => labels.includes(label));
    return selected.length === 1 && admitsRequest(labels) ? selected[0] === Scope.NumbersWithZero : undefined;
}), {kind: 'alternatives', alternatives: zeros.map(label => [label]),
    contextLabels: [...rangeLabels, ...widths], resolvedContext: true});
const permitsRange = (labels: string[]): boolean => {
    if (!contextLabels.some(label => labels.includes(label))) return true;
    return widths.filter(label => labels.includes(label)).length === 1
        && zeros.filter(label => labels.includes(label)).length === 1 && admitsRequest(labels);
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices,
    contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'standard-algorithm-division',
    compatibility: [generatorLabelRule('standard-division-canonical-band', [...contextLabels, ...rangeLabels], selected => {
        const labels = [...contextLabels, ...rangeLabels].filter(selected);
        return resolveCanonicalRangeFromLabels(labels) !== undefined && permitsRange(labels);
    })],
    generalLabels: [
        Area.DivisionStandardAlgorithm,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.MultipleDigitDividend,
        Scope.TwoOperands
    ]
};

export const StandardAlgorithmDivisionGeneratorSchema = {
    divisorDigits: [widths, resolveDivisorDigits, widths.map(label => [label])],
    requireZero: [zeros, resolveZeroOccurrence, zeros.map(label => [label])],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type StandardAlgorithmDivisionGeneratorConfig = ConfigFromSchema<typeof StandardAlgorithmDivisionGeneratorSchema>;
