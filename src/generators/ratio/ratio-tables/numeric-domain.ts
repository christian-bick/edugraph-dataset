import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

// Both the old upper100 request and unspecified range admitted base quantities1..24.
// Every task has a required quantity below5: construction factors2/3/4, recovered
// inverse factors3/4, or the plotted origin0. All share maximum4*max(base).
export const ratioTableRangeProfiles = canonicalRangeProfiles.filter(profile =>
    profile.range.min === 0 && [5,10,20,100].includes(profile.range.max));
export interface RatioTableBaseRow {
    readonly first: number;
    readonly seconds: readonly number[];
    readonly weight: number;
}
const cache = new Map<number, readonly RatioTableBaseRow[]>();
export function ratioTableBaseRows(range: CanonicalNumericRange): readonly RatioTableBaseRow[] {
    const profile = ratioTableRangeProfiles.find(profile => range && Object.entries(profile.range)
        .every(([key, value]) => range[key as keyof CanonicalNumericRange] === value));
    if (!profile) return [];
    const previous = cache.get(range.max);
    if (previous) return previous;
    const rows = Array.from({length: 24}, (_, index) => index + 1).flatMap(first => {
        const seconds = Array.from({length: 24}, (_, index) => index + 1).filter(second =>
            4 * Math.max(first, second) > range.maximumAbove && 4 * Math.max(first, second) <= range.max);
        return seconds.length ? [{first, seconds, weight: seconds.length}] : [];
    });
    cache.set(range.max, rows);
    return rows;
}
