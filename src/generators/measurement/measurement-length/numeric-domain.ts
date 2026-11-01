import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

/** The existing source union is1..100 in integer or exact tenth-unit steps. Origin0 is required. */
export const rulerRangeProfiles = canonicalRangeProfiles.filter(profile =>
    profile.range.min === 0 && profile.range.max <= 100
);
function domain(useDecimals: boolean, range: CanonicalNumericRange) {
    const profile = rulerRangeProfiles.find(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value));
    if (!profile) return undefined;
    const scale = useDecimals ? 10 : 1;
    const first = Math.max(scale, profile.range.maximumAbove * scale + 1);
    const last = profile.range.max * scale;
    return {first, scale, count: last - first + 1};
}
export const rulerLengthCaseCount = (useDecimals: boolean, range: CanonicalNumericRange): number =>
    domain(useDecimals, range)?.count ?? 0;

export function rulerLengthAt(useDecimals: boolean, range: CanonicalNumericRange, index: number): number {
    const source = domain(useDecimals, range);
    if (!source || !Number.isSafeInteger(index) || index < 0 || index >= source.count) {
        throw new RangeError('Unsupported canonical ruler profile or case index.');
    }
    return (source.first + index) / source.scale;
}
