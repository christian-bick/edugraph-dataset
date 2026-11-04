import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

const bounds = [5, 10, 20, 100, 120, 1000] as const;
// The original first-difference law preserves the first nonzero whole place.
// These nine cells, rather than every theoretical scalar pair, partition it.
const lowerBounds = [[0], [0, 5], [10], [10, 20], [100], [100, 120]] as const;
export const comparisonRangeMappings = bounds.flatMap((upper, index) => lowerBounds[index]!.map(lower =>
    [[`http://edugraph.io/edu/NumbersSmaller${upper}`, ...(lower ? [`http://edugraph.io/edu/NumbersLarger${lower}`] : [])],
        createCanonicalNumericRange(upper, lower)] as const));
export const comparisonRangeChoices = comparisonRangeMappings.map(([labels]) => [...labels]);
export const comparisonRangeLabels = [...new Set(comparisonRangeChoices.flat())];
export const comparisonAdjacentRangeChoices = comparisonRangeMappings.filter(([, range]) =>
    range.min === Math.max(0, range.maximumAbove)).map(([labels]) => labels);
const selectRange = selectExactLabelSetMap(comparisonRangeMappings);
const selectRelation = selectExactLabelMap([[Scope.Greater, 'greater'], [Scope.Equal, 'equal'], [Scope.Less, 'less']] as const);

export const supportsComparisonRange = (relation: string, range: {min: number; max: number}): boolean =>
    relation !== 'equal' || range.min === (bounds[bounds.indexOf(range.max as typeof bounds[number]) - 1] ?? 0);

// Each complete relation/range binding has a unique configuration. The source
// domain is numeric-only and all native represented operands are positive.
export const resolveComparisonRelation = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const relation = selectRelation(labels), range = selectRange(labels);
    return relation && (!range || supportsComparisonRange(relation, range)) ? relation : undefined;
}), {...selectRelation.labelChoices!, contextLabels: comparisonRangeLabels}));

export const resolveComparisonRange = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const relation = selectRelation(labels), range = selectRange(labels);
    return range && (!relation || supportsComparisonRange(relation, range)) ? range : undefined;
}), {kind: 'alternatives', alternatives: comparisonRangeChoices,
    contextLabels: [Scope.Greater, Scope.Equal, Scope.Less], resolvedContext: true}));
