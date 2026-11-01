import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const massEstimates = [
    {measurement: 'gram-weight', object: 'crayon', estimate: 10, unit: 'g', referenceObject: 'paperclip'},
    {measurement: 'gram-weight', object: 'apple', estimate: 200, unit: 'g', referenceObject: 'paperclip'},
    {measurement: 'gram-weight', object: 'book', estimate: 500, unit: 'g', referenceObject: 'paperclip'},
    {measurement: 'kilogram-weight', object: 'backpack', estimate: 3, unit: 'kg', referenceObject: 'one-kilogram-bag'},
    {measurement: 'kilogram-weight', object: 'chair', estimate: 5, unit: 'kg', referenceObject: 'one-kilogram-bag'},
    {measurement: 'kilogram-weight', object: 'bicycle', estimate: 12, unit: 'kg', referenceObject: 'one-kilogram-bag'}
] as const;

export const massEstimateRangeProfiles = canonicalRangeProfiles.filter(profile =>
    massEstimates.some(estimate => hasCanonicalRangeWitness([1, estimate.estimate], profile.range))
);

/** Question and solution assess the one-unit reference, its count and their product. */
export function massEstimatesForRange(measurement: string, range: CanonicalNumericRange) {
    const profile = massEstimateRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    return profile ? massEstimates.filter(estimate => estimate.measurement === measurement
        && hasCanonicalRangeWitness([1, estimate.estimate], profile.range)) : [];
}
