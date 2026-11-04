import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';

export const decimalNotationRangeChoices = [[Scope.NumbersSmaller10], [Scope.NumbersSmaller100]] as const;
export const decimalNotationRangeLabels = decimalNotationRangeChoices.flat();
export const resolveDecimalNotationRange = selectExactLabelSetMap([
    [decimalNotationRangeChoices[0], createCanonicalNumericRange(10)],
    [decimalNotationRangeChoices[1], createCanonicalNumericRange(100)]
] as const);
