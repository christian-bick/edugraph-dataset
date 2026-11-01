import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const scalingZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
export const scalingRangePairs = [[Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
    [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const scalingRangeLabels = scalingRangePairs.map(([label]) => label);
const smallerBounds = scalingRangePairs.filter(([, bound]) => bound <= 100).map(([label]) => label);
const selectZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const selectRange = selectExactLabelMap(scalingRangePairs.map(([label, bound]) => [label, createCanonicalNumericRange(bound)] as const));
export const resolveScalingZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = selectZero(labels);
    return zero === false && smallerBounds.some(label => labels.includes(label)) ? undefined : zero;
}), {kind: 'alternatives', alternatives: scalingZeroLabels.map(label => [label]), contextLabels: scalingRangeLabels});
export const resolveScalingRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.NumbersWithoutZero) && range && range.max <= 100 ? undefined : range;
}), {kind: 'alternatives', alternatives: scalingRangeLabels.map(label => [label]), contextLabels: scalingZeroLabels, resolvedContext: true});
