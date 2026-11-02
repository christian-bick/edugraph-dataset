import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const rows = Array.from({length: 9}, (_, index) => ({ones: index + 1, target: index + 11}));
export const teenRangeProfiles = canonicalRangeProfiles.filter(profile => rows.some(row =>
    hasCanonicalRangeWitness([10, row.ones, row.target], profile.range)));
export function teenRowsForRange(range: CanonicalNumericRange) {
    const profile = teenRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    return profile ? rows.filter(row => hasCanonicalRangeWitness([10, row.ones, row.target], profile.range)) : [];
}
