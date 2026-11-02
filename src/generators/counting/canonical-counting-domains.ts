import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {ParityConstraint} from './helpers.ts';

const counts = Array.from({length: 20}, (_, index) => index + 1);
const acceptsParity = (count: number, parity: ParityConstraint) => parity === 'any'
    || count % 2 === (parity === 'even' ? 0 : 1);
const sameRange = (left: CanonicalNumericRange, right: CanonicalNumericRange) => left
    && Object.entries(right).every(([key, value]) => left[key as keyof CanonicalNumericRange] === value);
export const selectionCountingProfiles = canonicalRangeProfiles.filter(profile => counts.some(requested =>
    counts.some(available => available >= requested
        && hasCanonicalRangeWitness([requested, available], profile.range))));
export const groupingCountingProfiles = canonicalRangeProfiles.filter(profile => counts.some(count =>
    hasCanonicalRangeWitness([count, 2, Math.floor(count / 2), count % 2], profile.range)));

export interface CountingSupplyRow {
    readonly requested: number;
    readonly first: number;
    readonly last: number;
    readonly weight: number;
}
// LCM(1..20) keeps the original uniform-request / uniform-supply path weights exact.
const commonDenominator = 232792560;
const supplyCache = new Map<string, readonly CountingSupplyRow[]>();
export function countingSupplyRows(range: CanonicalNumericRange, parity: ParityConstraint): readonly CountingSupplyRow[] {
    const profile = selectionCountingProfiles.find(profile => sameRange(range, profile.range));
    if (!profile) return [];
    const key = `${profile.range.min}/${profile.range.max}/${parity}`;
    const previous = supplyCache.get(key);
    if (previous) return previous;
    const rows = counts.filter(count => acceptsParity(count, parity)).flatMap(requested => {
        const available = counts.filter(count => count >= requested
            && hasCanonicalRangeWitness([requested, count], profile.range));
        return available.length ? [{requested, first: available[0]!, last: available[available.length - 1]!,
            weight: available.length * commonDenominator / (21 - requested)}] : [];
    });
    supplyCache.set(key, rows);
    return rows;
}

export type GroupingProfile = 'even' | 'singleton-odd' | 'positive-odd';
export function groupingCountsForRange(range: CanonicalNumericRange, parity: GroupingProfile): readonly number[] {
    const profile = groupingCountingProfiles.find(profile => sameRange(range, profile.range));
    return profile ? counts.filter(count => (parity === 'even' ? count % 2 === 0
        : parity === 'singleton-odd' ? count === 1 : count >= 3 && count % 2 === 1)
        && hasCanonicalRangeWitness([count, 2, Math.floor(count / 2), count % 2], profile.range)) : [];
}
