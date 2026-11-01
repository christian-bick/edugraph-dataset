import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

/** Complete pre-existing mathematical support: shorter length, difference, longer length. */
const lengthDifferences = Array.from({length: 11}, (_, shorter) =>
    Array.from({length: 8}, (_, difference) => [shorter + 5, difference + 2, shorter + difference + 7] as const)
).flat();

export const lengthDifferenceRangeProfiles = canonicalRangeProfiles.filter(profile =>
    lengthDifferences.some(tuple => hasCanonicalRangeWitness(tuple, profile.range))
);

/** Preselected profiles partition the finite support; this never derives output labels. */
export function lengthDifferenceTuples(range: CanonicalNumericRange): readonly (readonly [number, number, number])[] {
    const profile = lengthDifferenceRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    if (!profile) throw new Error('Unsupported canonical length-difference range.');
    return lengthDifferences.filter(tuple => hasCanonicalRangeWitness(tuple, profile.range));
}
