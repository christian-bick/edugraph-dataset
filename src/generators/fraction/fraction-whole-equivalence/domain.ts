import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

/** All three consumers explicitly require counting the numerator parts. */
export function wholeFractionCandidates(range: CanonicalNumericRange) {
    if (!range || range.min !== 0 || ![5, 10, 20, 100].includes(range.max)) throw new Error('Unsupported whole-fraction range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid whole-fraction range witnesses.');
    return ([1, 2, 3] as const).flatMap(wholeNumber => ([2, 3, 4, 6, 8] as const)
        .filter(denominator => wholeNumber * denominator <= range.max && wholeNumber * denominator > range.maximumAbove)
        .map(denominator => ({wholeNumber, denominator})));
}
