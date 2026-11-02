import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {PlaceValueHundredsBundlesProblem} from '../../../types/problems.ts';

const flats: readonly PlaceValueHundredsBundlesProblem[] = Array.from({length: 9}, (_, index) => ({
    hundreds: index + 1, tens: 0, ones: 0, target: (index + 1) * 100
}));
const regrouped: readonly PlaceValueHundredsBundlesProblem[] = [{hundreds: 1, tens: 10, ones: 0, target: 100}];
/** The represented bundle count and its value in ones; zero storage fields are not assessed. */
export const hundredsBundleQuantities = (data: PlaceValueHundredsBundlesProblem): readonly number[] =>
    data.tens === 10 ? [1, 10, 100] : [data.hundreds, 100, data.target];
export const hundredsBundleRangeProfiles = canonicalRangeProfiles.filter(profile =>
    [...flats, ...regrouped].some(row => hasCanonicalRangeWitness(hundredsBundleQuantities(row), profile.range)));
export function hundredsBundleRows(range: CanonicalNumericRange, requireRegrouping: boolean): readonly PlaceValueHundredsBundlesProblem[] {
    const profile = hundredsBundleRangeProfiles.find(profile => range && Object.entries(profile.range)
        .every(([key, value]) => range[key as keyof CanonicalNumericRange] === value));
    return profile && typeof requireRegrouping === 'boolean' ? (requireRegrouping ? regrouped : flats)
        .filter(row => hasCanonicalRangeWitness(hundredsBundleQuantities(row), profile.range)) : [];
}
