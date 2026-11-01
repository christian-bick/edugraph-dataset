import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

/** Every supplied tick is a scale anchor; zero is retained on all these axes. */
export function rationalLineScales(numberKind: 'integer' | 'fraction' | 'decimal', range: CanonicalNumericRange) {
    if (!['integer', 'fraction', 'decimal'].includes(numberKind) || !range || range.min !== 0 || ![5, 10, 20].includes(range.max))
        throw new Error('Unsupported rational-line kind or range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid rational-line range witnesses.');
    if (numberKind !== 'integer') return range.max === 5
        ? [2, 3, 4, 5].map(radius => ({radius, stepNumerator: 1})) : [];
    return [2, 3, 4, 5].flatMap(radius => [1, 2, 3].filter(step =>
        radius * step <= range.max && radius * step > range.maximumAbove)
        .map(stepNumerator => ({radius, stepNumerator})));
}
