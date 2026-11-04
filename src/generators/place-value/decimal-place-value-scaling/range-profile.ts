import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
export const scalingRangePairs = [[Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100],
    [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000]] as const;
export const scalingRangeLabels = scalingRangePairs.map(([label]) => label);
export const resolveScalingRange = selectExactLabelMap(scalingRangePairs.map(([label, bound]) => [label, createCanonicalNumericRange(bound)] as const));
