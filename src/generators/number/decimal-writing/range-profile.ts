import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';

export const decimalValueRangeChoices = [[Scope.NumbersSmaller5], [Scope.NumbersLarger5, Scope.NumbersSmaller10]] as const;
export const decimalValueRangeLabels = [...new Set(decimalValueRangeChoices.flat())];
export const resolveDecimalValueRange = selectExactLabelSetMap([
    [decimalValueRangeChoices[0], createCanonicalNumericRange(5)],
    [decimalValueRangeChoices[1], createCanonicalNumericRange(10, 5)]
] as const);
