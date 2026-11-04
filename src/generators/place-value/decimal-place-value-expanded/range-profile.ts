import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
export const expandedRangePairs = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const expandedRangeLabels = expandedRangePairs.map(([label]) => label);
export const resolveExpandedRange = selectExactLabelMap(expandedRangePairs.map(([label, bound]) => [label, createCanonicalNumericRange(bound)] as const));
