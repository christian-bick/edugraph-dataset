import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const rows = Array.from({length: 9}, (_, index) => ({tens: index + 1, ones: 0 as const, target: (index + 1) * 10}));
export const tensRangeProfiles = canonicalRangeProfiles.filter(profile => rows.some(row =>
    hasCanonicalRangeWitness([row.tens, 10, row.target], profile.range)));
export function tensRowsForRange(range: CanonicalNumericRange) {
    const profile = tensRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    return profile ? rows.filter(row => hasCanonicalRangeWitness([row.tens, 10, row.target], profile.range)) : [];
}
