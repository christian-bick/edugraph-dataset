import { Scope } from 'edugraph-ts/generated';
import { selectExactLabelSetMap } from './resolvers.ts';
import { CANONICAL_RANGE_THRESHOLDS, createCanonicalNumericRange } from './canonical-numeric-range.ts';
import { withLabelChoices } from '../types/schema.ts';

const bounds = [
    [5, Scope.NumbersSmaller5, Scope.NumbersLarger5],
    [10, Scope.NumbersSmaller10, Scope.NumbersLarger10],
    [20, Scope.NumbersSmaller20, Scope.NumbersLarger20],
    [100, Scope.NumbersSmaller100, Scope.NumbersLarger100],
    [120, Scope.NumbersSmaller120, Scope.NumbersLarger120],
    [1000, Scope.NumbersSmaller1000, Scope.NumbersLarger1000],
    [10000, Scope.NumbersSmaller10000, Scope.NumbersLarger10000],
    [100000, Scope.NumbersSmaller100000, Scope.NumbersLarger100000],
    [1000000, Scope.NumbersSmaller1000000, Scope.NumbersLarger1000000]
] as const;

/** Pre-generation alternatives. Excluding equal endpoints prevents the conflicting singleton cell. */
export const canonicalRangeProfiles = bounds.flatMap(([upper, upperLabel]) => [
    { labels: [upperLabel] as string[], range: createCanonicalNumericRange(upper) },
    ...bounds.filter(([lower]) => lower < upper).map(([lower, , lowerLabel]) => ({
        labels: [upperLabel, lowerLabel] as string[],
        range: createCanonicalNumericRange(upper, lower)
    }))
]);

export const canonicalRangeLabels = [...new Set(canonicalRangeProfiles.flatMap(profile => profile.labels))];

/** Restrict a producer's supported upper bands without changing the catalog predecessors. */
export function canonicalRangeLabelChoices(uppers: readonly number[] = CANONICAL_RANGE_THRESHOLDS): string[][] {
    if (uppers.length === 0 || uppers.some(upper => !bounds.some(([value]) => value === upper))) {
        throw new Error('Canonical range choices require supported upper thresholds.');
    }
    return canonicalRangeProfiles.filter(profile => uppers.includes(profile.range.max))
        .map(profile => [...profile.labels]);
}

export const resolveCanonicalRangeFromLabels = withLabelChoices(selectExactLabelSetMap(
    canonicalRangeProfiles.map(profile => [profile.labels, profile.range] as const)
), {kind: 'alternatives', relation: 'capability', alternatives: canonicalRangeLabelChoices()});

/** The empty alternative lets a mixed-number producer keep noninteger branches outside this rollout. */
export const resolveOptionalCanonicalRangeFromLabels = withLabelChoices(selectExactLabelSetMap([
    [[], false],
    ...canonicalRangeProfiles.map(profile => [profile.labels, profile.range] as const)
]), {kind: 'alternatives', relation: 'capability', alternatives: [[], ...canonicalRangeLabelChoices()]});
