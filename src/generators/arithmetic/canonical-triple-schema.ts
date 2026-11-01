import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeLabelChoices, canonicalRangeLabels, canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../lib/canonical-range-labels.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';
import {arithmeticOperations, operationNames} from './helpers.ts';
import {canSampleCanonicalTriple, type CanonicalTripleConfig} from './canonical-triple-sampling.ts';
import {arithmeticTripleSchema} from './arithmetic-triple-schema.ts';
import {generatorLabelRule} from '../compatibility-rules.ts';

const smallSumBounds = [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20];
const resolveTripleMultipleOf10 = withLabelChoices(hasLabel(Scope.MultiplesOf10), {
    kind: 'alternatives',
    alternatives: [[], [Scope.MultiplesOf10], [Scope.SingleDigitSmallestOperand], [Scope.TwoDigitSmallestOperand]],
    defaults: [
        ...smallSumBounds.map(bound => ({whenAll: [Area.Addition, bound], whenNone: [Area.DistributiveLaw],
            labels: [Scope.SingleDigitSmallestOperand]})),
        {whenAll: [Area.Addition, Scope.NumbersLarger10, Scope.NumbersSmaller100],
            whenNone: [Scope.NumbersWithZero, Area.DistributiveLaw], labels: [Scope.TwoDigitSmallestOperand]},
        {labels: []}
    ]
});
export const canonicalTripleWidthRule = generatorLabelRule('proved-canonical-triple-width', [
    Area.Addition, Area.DistributiveLaw, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand,
    ...smallSumBounds, Scope.NumbersLarger10, Scope.NumbersSmaller100, Scope.NumbersWithZero
], selected => (!selected(Scope.SingleDigitSmallestOperand) || selected(Area.DistributiveLaw)
        || selected(Area.Addition) && smallSumBounds.some(selected))
    && (!selected(Scope.TwoDigitSmallestOperand) || selected(Area.Addition) && selected(Scope.NumbersLarger10)
        && selected(Scope.NumbersSmaller100) && !selected(Scope.NumbersWithZero) && !selected(Area.DistributiveLaw)));

export const canonicalTripleFields = {
    operation: arithmeticTripleSchema.operation,
    requireZero: arithmeticTripleSchema.requireZero,
    requireMultipleOf10: [[Scope.MultiplesOf10, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand],
        resolveTripleMultipleOf10, [[], [Scope.MultiplesOf10]]],
    useCommutativeLaw: arithmeticTripleSchema.useCommutativeLaw,
    useAssociativeLaw: arithmeticTripleSchema.useAssociativeLaw,
    useDistributiveLaw: arithmeticTripleSchema.useDistributiveLaw
} as const;

export const canonicalTripleContextLabels = [...arithmeticOperations, Scope.NumbersWithZero, Scope.MultiplesOf10,
    Scope.TwoDigitLargestOperand, Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw];

export function canonicalTripleConfigFromSelection(selected: (label: string) => boolean): CanonicalTripleConfig | null {
    const operations = arithmeticOperations.filter(selected);
    const rangeLabels = canonicalRangeLabels.filter(selected);
    const profile = canonicalRangeProfiles.find(candidate => candidate.labels.length === rangeLabels.length && candidate.labels.every(selected));
    const operation = selected(Area.DistributiveLaw) && selected(Area.Multiplication)
        ? Area.Multiplication : operations.length === 1 ? operations[0] : undefined;
    return operation !== undefined && profile !== undefined ? {
        operation: operationNames[operation], range: profile.range, requireZero: selected(Scope.NumbersWithZero),
        requireMultipleOf10: selected(Scope.MultiplesOf10), requireTwoDigitOperands: selected(Scope.TwoDigitLargestOperand),
        useCommutativeLaw: selected(Area.CommutativeLaw), useAssociativeLaw: selected(Area.AssociativeLaw),
        useDistributiveLaw: selected(Area.DistributiveLaw)
    } : null;
}

export const canonicalTripleDomainRule = generatorLabelRule('canonical-triple-domain', [
    ...canonicalTripleContextLabels, ...canonicalRangeLabels
], selected => {
    const config = canonicalTripleConfigFromSelection(selected);
    return config !== null && canSampleCanonicalTriple(config);
});

export const resolveCanonicalTripleRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    if (range === undefined || !arithmeticOperations.some(label => labels.includes(label))) return range;
    const config = canonicalTripleConfigFromSelection(label => labels.includes(label));
    return config && canSampleCanonicalTriple(config) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: canonicalRangeLabelChoices(),
    contextLabels: canonicalTripleContextLabels, resolvedContext: true});
