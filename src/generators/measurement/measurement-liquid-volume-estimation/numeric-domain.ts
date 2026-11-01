import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const liquidEstimates = [
    {container: 'water-bottle', estimateLiters: 1},
    {container: 'juice-carton', estimateLiters: 2},
    {container: 'watering-can', estimateLiters: 5},
    {container: 'bucket', estimateLiters: 10}
] as const;

export const liquidEstimateRangeProfiles = canonicalRangeProfiles.filter(profile =>
    liquidEstimates.some(estimate => hasCanonicalRangeWitness([1, estimate.estimateLiters], profile.range))
);

/** The required one-liter comparison reference is part of every exercise. */
export function liquidEstimatesForRange(range: CanonicalNumericRange) {
    const profile = liquidEstimateRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    return profile ? liquidEstimates.filter(estimate =>
        hasCanonicalRangeWitness([1, estimate.estimateLiters], profile.range)) : [];
}
