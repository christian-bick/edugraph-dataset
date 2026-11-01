import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const massReadings = [
    {measurement: 'gram-weight', object: 'apple', value: 180, unit: 'g'},
    {measurement: 'gram-weight', object: 'book', value: 450, unit: 'g'},
    {measurement: 'gram-weight', object: 'toy-car', value: 320, unit: 'g'},
    {measurement: 'kilogram-weight', object: 'watermelon', value: 4, unit: 'kg'},
    {measurement: 'kilogram-weight', object: 'backpack', value: 3, unit: 'kg'},
    {measurement: 'kilogram-weight', object: 'suitcase', value: 12, unit: 'kg'}
] as const;

export const massReadingRangeProfiles = canonicalRangeProfiles.filter(profile =>
    massReadings.some(reading => hasCanonicalRangeWitness([reading.value], profile.range))
);

/** The sole consumer reads the digital mass directly; drawing coordinates are not quantities. */
export function massReadingsForRange(measurement: string, range: CanonicalNumericRange) {
    const profile = massReadingRangeProfiles.find(profile =>
        Object.entries(profile.range).every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value)
    );
    return profile ? massReadings.filter(reading => reading.measurement === measurement
        && hasCanonicalRangeWitness([reading.value], profile.range)) : [];
}
