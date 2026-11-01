import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

type NumberKind = 'fraction' | 'decimal';
const rows = {
    // Original fractions choose quarters/eighths equally, then choose a uniform interior index.
    fraction: ([4, 8] as const).flatMap(tickCount => Array.from({length: tickCount - 2}, (_, index) =>
        ({tickCount, targetIndex: index + 2, weight: tickCount === 4 ? 3 : 1}))),
    decimal: Array.from({length: 8}, (_, index) => ({tickCount: 10 as const, targetIndex: index + 2, weight: 1}))
};
export const measurementLineRangeProfiles = canonicalRangeProfiles.filter(profile =>
    Object.values(rows).flat().some(row => hasCanonicalRangeWitness([0, 1, row.targetIndex], profile.range))
);
function domain(numberKind: NumberKind, range: CanonicalNumericRange) {
    const profile = measurementLineRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    // The provided line is already partitioned: denominators are not separate requested counts.
    // The solution explicitly assesses targetIndex equal steps; axis values stay between0 and1.
    return profile ? rows[numberKind].filter(row => hasCanonicalRangeWitness([0, 1, row.targetIndex], profile.range)) : [];
}
export const measurementLineCaseCount = (numberKind: NumberKind, range: CanonicalNumericRange): number =>
    domain(numberKind, range).reduce((count, row) => count + row.weight, 0);

/** Weighted tickets retain the original within-profile probabilities, without deriving labels from output. */
export function measurementLineFrameAt(numberKind: NumberKind, range: CanonicalNumericRange, index: number) {
    const pool = domain(numberKind, range);
    const count = pool.reduce((total, row) => total + row.weight, 0);
    if (!Number.isSafeInteger(index) || index < 0 || index >= count) {
        throw new RangeError('Unsupported measurement-line profile or case index.');
    }
    let offset = index;
    for (const row of pool) {
        if (offset < row.weight) return {tickCount: row.tickCount, targetIndex: row.targetIndex};
        offset -= row.weight;
    }
    throw new RangeError('Measurement-line index exceeded its finite domain.');
}
