import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const expandedZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export const expandedRangePairs = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const expandedRangeLabels = expandedRangePairs.map(([label]) => label);
const smallerBounds = expandedRangePairs.filter(([, bound]) => bound <= 100).map(([label]) => label);
const selectZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const selectRange = selectExactLabelMap(expandedRangePairs.map(([label, bound]) => [label, createCanonicalNumericRange(bound)] as const));
export const resolveExpandedZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = selectZero(labels);
    return zero === false && smallerBounds.some(label => labels.includes(label)) ? undefined : zero;
}), {kind: 'alternatives', alternatives: expandedZeroLabels.map(label => [label]), contextLabels: expandedRangeLabels});
export const resolveExpandedRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.NumbersWithoutZero) && range && range.max <= 100 ? undefined : range;
}), {kind: 'alternatives', alternatives: expandedRangeLabels.map(label => [label]), contextLabels: expandedZeroLabels, resolvedContext: true});
