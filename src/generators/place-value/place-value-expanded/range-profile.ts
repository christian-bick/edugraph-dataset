import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap, selectExactMatch} from '../../../lib/resolvers.ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {expandedRangeBounds, hasExpandedCardinalityDomain} from './domain.ts';

const mappings = expandedRangeBounds.map(([upper, lower]) => [[`http://edugraph.io/edu/NumbersSmaller${upper}`,
    ...(lower ? [`http://edugraph.io/edu/NumbersLarger${lower}`] : [])], createCanonicalNumericRange(upper, lower)] as const);
export const expandedRangeChoices = mappings.map(([labels]) => labels);
export const expandedRangeLabels = [...new Set(expandedRangeChoices.flat())];
const selectRange = selectExactLabelSetMap(mappings);
export const expandedCardinalityLabels = [Scope.TwoOperands, Scope.ThreeOperands] as const;
// Every admitted label/context binding has one finite configuration value;
// range.it.test.tsx proves deterministic resolution on all real source cells.
export const resolveExpandedCardinality = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    if (range && !hasExpandedCardinalityDomain(range.max, range.min, 3))
        return labels.includes(Scope.ThreeOperands) ? undefined : Scope.TwoOperands;
    return selectExactMatch(labels, expandedCardinalityLabels);
}), {kind: 'alternatives', alternatives: expandedCardinalityLabels.map(label => [label]), contextLabels: expandedRangeLabels}));
export const resolveExpandedRange = registerStaticResolver(withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.ThreeOperands) && range
        && !hasExpandedCardinalityDomain(range.max, range.min, 3) ? undefined : range;
}), {kind: 'alternatives', relation: 'capability', alternatives: expandedRangeChoices,
    contextLabels: [Scope.TwoOperands, Scope.ThreeOperands], resolvedContext: true}));
