import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const roundingZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export const roundingRanges = [
    ...[[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
        [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]].map(([label, bound]) =>
        [[label as string], createCanonicalNumericRange(bound as number)] as const),
    ...[[Scope.NumbersLarger5, 5], [Scope.NumbersLarger10, 10], [Scope.NumbersLarger20, 20]].map(([label, bound]) =>
        [[Scope.NumbersSmaller1000, label as string], createCanonicalNumericRange(1000, bound as number)] as const)
] as const;
export const roundingRangeChoices = roundingRanges.map(([labels]) => [...labels]);
export const roundingRangeLabels = [...new Set(roundingRangeChoices.flat())];
const selectZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const selectRange = selectExactLabelSetMap(roundingRanges);
export const supportsRoundingRange = (zero: boolean, range: {min: number; max: number}) => !zero
    || range.min === 0 && [5, 10, 100].includes(range.max);
export const resolveRoundingZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = selectZero(labels), range = selectRange(labels);
    const requiresPositiveMinimum = [Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger20].some(label => labels.includes(label));
    return zero === true && (requiresPositiveMinimum || range && !supportsRoundingRange(true, range)) ? undefined : zero;
}), {kind: 'alternatives', alternatives: roundingZeroLabels.map(label => [label]), contextLabels: roundingRangeLabels});
export const resolveRoundingRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return range && labels.includes(Scope.NumbersWithZero) && !supportsRoundingRange(true, range) ? undefined : range;
}), {kind: 'alternatives', alternatives: roundingRangeChoices, contextLabels: roundingZeroLabels, resolvedContext: true});
