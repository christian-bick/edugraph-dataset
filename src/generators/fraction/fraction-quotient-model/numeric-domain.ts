import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {fractionNotationPairs, type QuotientNumericProfile} from './numeric-profiles.ts';

export type QuotientRangePair = readonly [number, number];
const cache = new Map<string, readonly QuotientRangePair[]>();

/** Required whole sharing counts and actual quotient/group counts. The unused
 * totalParts product is not a quantity assessed by these projections. */
export function quotientRangePairs(role: 'notation' | 'whole-sharing' | 'unit-divisor', profile: QuotientNumericProfile,
    range: CanonicalNumericRange): readonly QuotientRangePair[] {
    if (!range || range.min !== 0 || ![5, 10, 20, 100].includes(range.max))
        throw new GeneratorValidationError('fraction-quotient-model', 'Choose a supported canonical quotient range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('fraction-quotient-model', 'Quotient range witnesses must agree with the bounds.');
    if (role === 'notation' ? profile !== 'proper' && profile !== 'improper' : profile !== 'zero' && profile !== 'nonzero')
        throw new GeneratorValidationError('fraction-quotient-model', 'The numeric profile must agree with the original quotient role.');
    const key = `${role}:${profile}:${range.max}`;
    const existing = cache.get(key);
    if (existing) return existing;
    const pairs: QuotientRangePair[] = role === 'notation' ? [...fractionNotationPairs(profile as 'proper' | 'improper')]
        : Array.from({length: profile === 'zero' ? 1 : 6}, (_, index) => profile === 'zero' ? 0 : index + 1)
            .flatMap(first => Array.from({length: role === 'unit-divisor' ? 5 : 6}, (_, index) =>
                [first, index + (role === 'unit-divisor' ? 2 : 1)] as const));
    const retained = pairs.filter(([first, second]) => {
        // A zero dividend leaves no pieces to count. Its empty reference is one
        // meter; the denominator in the supplied unit fraction is notation.
        const maximum = role === 'unit-divisor' ? first === 0 ? 1 : first * second : Math.max(first, second);
        return maximum <= range.max && maximum > range.maximumAbove;
    });
    cache.set(key, retained);
    return retained;
}
