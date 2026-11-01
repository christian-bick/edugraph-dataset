import {Scope} from 'edugraph-ts';
import {resolveCanonicalRangeFromLabels} from '../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';
import {clockIntervals, resolveClockProfile} from './clock-profile.ts';
import {clockCaseCount, clockRangeProfiles} from './numeric-domain.ts';

export const clockRangeChoices = clockRangeProfiles.map(profile => profile.labels);
export const clockRangeLabels = [...new Set(clockRangeChoices.flat())];
export const clockRangeContext = [...clockIntervals, Scope.NumbersWithZero, Scope.NumbersWithoutZero, Scope.MultiplesOf5];
export function permitsClockRange(labels: string[], range: CanonicalNumericRange): boolean {
    const clockProfile = resolveClockProfile(labels);
    return clockProfile === undefined || clockCaseCount({clockProfile, range,
        requireMultipleOf5: labels.includes(Scope.MultiplesOf5), isAnteMeridiem: false, isPostMeridiem: false}) > 0;
}
export const resolveClockRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsClockRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: clockRangeChoices, relation: 'capability',
    contextLabels: clockRangeContext, resolvedContext: true});
