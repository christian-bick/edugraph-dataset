import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {CANONICAL_RANGE_THRESHOLDS, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {MeasurementConversionPairId, MeasurementConversionStoryProblem} from '../../../types/problems.ts';
import {decimalLargerHundredths, integerLargerHundredths, measurementConversionPairSeeds} from '../helpers.ts';

type NumberKind = MeasurementConversionStoryProblem['numberKind'];
export type StoryTuple = Readonly<{sourceSide: 'larger' | 'smaller'; largerHundredths: number; additionalTargetHundredths: number}>;
const domains = new Map<string, Map<number, StoryTuple[]>>();
for (const factor of [16, 60, 100, 1000]) for (const kind of ['integer', 'decimal'] as const) {
    const groups = new Map<number, StoryTuple[]>();
    const candidates = kind === 'integer' ? integerLargerHundredths : decimalLargerHundredths;
    for (const sourceSide of ['larger', 'smaller'] as const) for (const larger of candidates) {
        const scale = sourceSide === 'larger' ? Math.max(1, Math.floor(factor / 10)) : 1;
        for (let whole = 1; whole <= 5; whole++) for (const fraction of kind === 'integer' ? [0] : [25, 50, 75]) {
            const additional = whole * scale * 100 + fraction;
            const converted = sourceSide === 'larger' ? larger * factor : larger;
            const maximum = Math.max(factor, larger / 100, larger * factor / 100,
                additional / 100, (converted + additional) / 100);
            const upper = CANONICAL_RANGE_THRESHOLDS.find(bound => maximum <= bound)!;
            if (!groups.has(upper)) groups.set(upper, []);
            groups.get(upper)!.push({sourceSide, largerHundredths: larger, additionalTargetHundredths: additional});
        }
    }
    domains.set(`${factor}:${kind}`, groups);
}

export const conversionStoryRangeProfiles = canonicalRangeProfiles.filter(profile => profile.range.min === 0
    && [...domains.values()].some(groups => groups.has(profile.range.max)));

/** Required values include the given one-unit relation, conversion, addend and final total. */
export function conversionStoryTuples(pairId: MeasurementConversionPairId, kind: NumberKind,
    range: CanonicalNumericRange): readonly StoryTuple[] {
    if (!conversionStoryRangeProfiles.some(profile => Object.entries(profile.range)
        .every(([key, value]) => range?.[key as keyof CanonicalNumericRange] === value))) return [];
    return domains.get(`${measurementConversionPairSeeds[pairId]?.factor}:${kind}`)?.get(range.max) ?? [];
}
