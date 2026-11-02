import {canonicalRangeProfiles} from '../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {CountingOffsetProblem} from '../../types/problems.ts';
import {buildCountingOffsetProblem, countingOffsetStarts, type CountingOffsetOperandProfile} from './counting-offset.ts';

/** The method explicitly changes1 ten/hundred and assesses the supplied place-unit counts. */
export function placeValueOffsetQuantities(data: CountingOffsetProblem<10 | 100>): number[] {
    return [data.numObjects, data.stepSize, data.incDecAnswer, 1,
        ...Object.values(data.startPlaceValue), ...Object.values(data.resultPlaceValue),
        ...(data.stepSize === 100 ? [data.numObjects % 100, data.incDecAnswer % 100] : [])];
}
const cache = new Map<string, readonly number[]>();
export function placeValueOffsetStarts(
    step: 10 | 100, range: CanonicalNumericRange, direction: 'inc' | 'dec',
    profile: CountingOffsetOperandProfile, requireZero: boolean
): readonly number[] {
    const canonical = canonicalRangeProfiles.find(candidate => candidate.range.min === 0 && candidate.range.max <= 1000
        && range && Object.entries(candidate.range).every(([key, value]) => range[key as keyof CanonicalNumericRange] === value));
    if (!canonical || !['inc', 'dec'].includes(direction) || typeof requireZero !== 'boolean') return [];
    const key = JSON.stringify([step, range.max, direction, profile, requireZero]);
    const previous = cache.get(key);
    if (previous) return previous;
    const starts = countingOffsetStarts({direction, range: {min: 1, max: range.max}}, step, profile).filter(start => {
        const values = placeValueOffsetQuantities(buildCountingOffsetProblem(start, direction, step, range.max));
        return hasCanonicalRangeWitness(values, range) && values.includes(0) === requireZero;
    });
    cache.set(key, starts);
    return starts;
}
export const placeValueOffsetRangeProfiles = (step: 10 | 100) => canonicalRangeProfiles.filter(profile =>
    profile.range.min === 0 && profile.range.max <= 1000 && (['inc', 'dec'] as const).some(direction =>
        [false, true].some(zero => placeValueOffsetStarts(step, profile.range, direction, 'unrestricted', zero).length > 0)));
