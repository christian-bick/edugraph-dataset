import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const comparisonRangeMappings = [
    ...[[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
        [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]].map(([label, bound]) =>
        [[label as string], createCanonicalNumericRange(bound as number)] as const),
    [[Scope.NumbersSmaller1000, Scope.NumbersLarger5], createCanonicalNumericRange(1000, 5)] as const
] as const;
export const comparisonRangeChoices = comparisonRangeMappings.map(([labels]) => [...labels]);
export const comparisonRangeLabels = [...new Set(comparisonRangeChoices.flat())];
const selectRange = selectExactLabelSetMap(comparisonRangeMappings);
export const supportsComparisonRange = (nonzero: boolean, range: {min: number; max: number}) => nonzero
    ? range.max >= 120 : range.min === 0;
export const resolveComparisonRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    if (!range) return undefined;
    return labels.includes(Scope.NumbersWithoutZero) ? supportsComparisonRange(true, range) ? range : undefined
        : labels.includes(Scope.NumbersWithZero) || labels.includes(Scope.Equal) ? supportsComparisonRange(false, range) ? range : undefined : range;
}), {kind: 'alternatives', alternatives: comparisonRangeChoices,
    contextLabels: [Scope.NumbersWithZero, Scope.NumbersWithoutZero, Scope.Greater, Scope.Equal, Scope.Less], resolvedContext: true});
export const comparisonRelationAllowed = (labels: string[], nonzero: boolean) => {
    if (!nonzero && labels.includes(Scope.NumbersLarger5)) return false;
    const range = selectRange(labels);
    return !range || supportsComparisonRange(nonzero, range);
};
