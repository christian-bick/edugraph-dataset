import { createCanonicalNumericRange, type CanonicalNumericRange } from '../../../lib/canonical-numeric-range.ts';
export type FractionLineKind = 'unit' | 'nonunit' | 'improper';
const denominators = [2, 3, 4, 6, 8] as const;
/** The question assesses partition cardinality and the solution assesses iteration cardinality. */
export function fractionLineCandidates(kind: FractionLineKind, range: CanonicalNumericRange) {
    if (!['unit', 'nonunit', 'improper'].includes(kind) || !range || range.min !== 0 || ![5, 10, 20].includes(range.max))
        throw new Error('Unsupported fraction-line kind or canonical range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid fraction-line range witnesses.');
    return denominators.flatMap(denominator => Array.from({ length: 2 * denominator - 1 }, (_, i) => i + 1)
        .filter(numerator => kind === 'unit' ? numerator === 1 : kind === 'nonunit' ? numerator > 1 && numerator < denominator : numerator > denominator)
        .filter(numerator => Math.max(numerator, denominator) <= range.max && Math.max(numerator, denominator) > range.maximumAbove)
        .map(numerator => ({ numerator, denominator })));
}
