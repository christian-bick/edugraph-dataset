import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';

export type ClassificationRelation = 'least' | 'most' | 'ascending' | 'descending';
export interface CategoryAllocation {
    readonly counts: readonly number[];
    readonly weight: number;
}
const factorials = [1];
for (let value = 1; value <= 17; value++) factorials[value] = factorials[value - 1]! * value;
const denominator = 3 ** 17;
// Original support: uniform total1..20 (count) or3..20 (sort), then uniform category placements.
// Multinomial multiplicities combine duplicate paths without storing their permutations.
const allocations: readonly CategoryAllocation[] = [
    {counts: [1], weight: denominator}, {counts: [1, 1], weight: denominator},
    ...Array.from({length: 18}, (_, index) => index + 3).flatMap(total => {
        const rows: CategoryAllocation[] = [];
        for (let a = 1; a <= total - 2; a++) for (let b = 1; b <= total - a - 1; b++) {
            const c = total - a - b, remaining = total - 3;
            const multiplicity = factorials[remaining]! / (factorials[a - 1]! * factorials[b - 1]! * factorials[c - 1]!);
            rows.push({counts: [a, b, c], weight: multiplicity * 3 ** (17 - remaining)});
        }
        return rows;
    })
];
export const classificationRangeProfiles = canonicalRangeProfiles.filter(profile => allocations.some(row =>
    hasCanonicalRangeWitness(row.counts, profile.range)));
const cache = new Map<string, readonly CategoryAllocation[]>();
export function classificationRows(range: CanonicalNumericRange, relation?: ClassificationRelation): readonly CategoryAllocation[] {
    const profile = classificationRangeProfiles.find(profile => range && Object.entries(profile.range)
        .every(([key, value]) => range[key as keyof CanonicalNumericRange] === value));
    if (!profile) return [];
    const key = `${profile.range.min}/${profile.range.max}/${relation ?? 'count'}`;
    const existing = cache.get(key);
    if (existing) return existing;
    const rows = allocations.filter(row => {
        if (!hasCanonicalRangeWitness(row.counts, profile.range)) return false;
        if (!relation) return true;
        if (row.counts.length !== 3 || new Set(row.counts).size < 2) return false;
        const endpoint = relation === 'least' ? Math.min(...row.counts) : Math.max(...row.counts);
        return relation !== 'least' && relation !== 'most' || row.counts.filter(count => count === endpoint).length === 1;
    });
    cache.set(key, rows);
    return rows;
}
/** Conditions the original complete path law on an ordinary pre-generation profile. */
export function sampleClassificationAllocation(rows: readonly CategoryAllocation[], draw: () => number): CategoryAllocation | undefined {
    if (!rows.length) return undefined;
    let ticket = draw() * rows.reduce((sum, row) => sum + row.weight, 0);
    return rows.find(row => (ticket -= row.weight) < 0) ?? rows[rows.length - 1]!;
}
