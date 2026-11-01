import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const validRange = (range: CanonicalNumericRange): boolean => canonicalRangeProfiles.some(profile =>
    profile.range.max <= 100 && Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));

/** The complete factor proof includes1 and never exceeds the classified number. */
export const factorPairNumbers = (range: CanonicalNumericRange): number[] => !validRange(range) ? []
    : Array.from({length: 99}, (_, index) => index + 1)
        .filter(number => hasCanonicalRangeWitness([number, 1], range));

/** Original divisor-then-quotient probability, conditioned on a canonical band. */
export function multipleTestCases(range: CanonicalNumericRange) {
    if (!validRange(range)) return [];
    return Array.from({length: 8}, (_, index) => index + 2).flatMap(divisor => {
        const maximumQuotient = Math.floor(99 / divisor);
        return Array.from({length: maximumQuotient}, (_, index) => index + 1)
            .filter(quotient => hasCanonicalRangeWitness([divisor, quotient, divisor * quotient], range))
            .map(quotient => ({divisor, quotient, weight: 1 / (8 * maximumQuotient)}));
    });
}

export const factorMultipleRangeProfiles = canonicalRangeProfiles.filter(profile =>
    profile.range.max <= 100 && (factorPairNumbers(profile.range).length > 0 || multipleTestCases(profile.range).length > 0));
