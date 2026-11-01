import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {CANONICAL_RANGE_THRESHOLDS, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {MeasurementConversionPairId, MeasurementConversionNumericExamples} from '../../../types/problems.ts';
import {decimalLargerHundredths, integerLargerHundredths, measurementConversionPairSeeds} from '../helpers.ts';

type NumberKind = MeasurementConversionNumericExamples['numberKind'];
type Tuple = readonly [number, number];

/** Both required equalities, their factor and the given one-unit relation determine the profile. */
const domains = new Map<string, Map<number, Tuple[]>>();
for (const factor of [16, 60, 100, 1000]) for (const kind of ['integer', 'decimal'] as const) {
    const candidates = kind === 'integer' ? integerLargerHundredths : decimalLargerHundredths;
    const groups = new Map<number, Tuple[]>();
    for (const first of candidates) for (const second of candidates) {
        if (first === second) continue;
        const maximum = Math.max(factor, first / 100, second / 100, first * factor / 100, second * factor / 100);
        const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => maximum <= bound)!;
        if (!groups.has(upper)) groups.set(upper, []);
        groups.get(upper)!.push([first, second]);
    }
    domains.set(`${factor}:${kind}`, groups);
}

export const conversionValueRangeProfiles = canonicalRangeProfiles.filter(profile => profile.range.min === 0
    && [...domains.values()].some(groups => groups.has(profile.range.max)));

export function conversionValueTuples(
    pairId: MeasurementConversionPairId, kind: NumberKind, range: CanonicalNumericRange
): readonly Tuple[] {
    if (!conversionValueRangeProfiles.some(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value))) return [];
    const factor = measurementConversionPairSeeds[pairId]?.factor;
    return domains.get(`${factor}:${kind}`)?.get(range.max) ?? [];
}
