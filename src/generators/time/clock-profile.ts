import {Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';

export const clockIntervals = [Scope.SecondIntervals, Scope.MinuteIntervals,
    Scope.HalfHourIntervals, Scope.HourIntervals] as const;
export type ClockInterval = typeof clockIntervals[number];
export interface ClockProfile {
    readonly intervalLabel: ClockInterval;
    readonly mode: 'legacy-seconds' | 'zero-seconds' | 'zero-minutes' | 'positive-minutes' | 'half-hour' | 'whole-hour';
}

export const clockProfileChoices = [
    [Scope.SecondIntervals],
    [Scope.SecondIntervals, Scope.NumbersWithZero],
    [Scope.MinuteIntervals, Scope.NumbersWithZero],
    [Scope.MinuteIntervals, Scope.NumbersWithoutZero],
    [Scope.HalfHourIntervals, Scope.NumbersWithoutZero],
    [Scope.HourIntervals, Scope.NumbersWithZero]
] as const;

/** One joint interval/occurrence choice replaces the ambiguous false zero predicate. */
export const resolveClockProfile = withLabelChoices(exactResolver((labels: string[]): ClockProfile | undefined => {
    const intervals = clockIntervals.filter(interval => labels.includes(interval));
    if (intervals.length !== 1) return undefined;
    const intervalLabel = intervals[0]!;
    const zero = labels.includes(Scope.NumbersWithZero);
    const positive = labels.includes(Scope.NumbersWithoutZero);
    const fiveMinutes = labels.includes(Scope.MultiplesOf5);
    if (zero && positive || fiveMinutes && intervalLabel !== Scope.MinuteIntervals) return undefined;
    if (intervalLabel === Scope.HourIntervals) {
        return positive ? undefined : {intervalLabel, mode: 'whole-hour'};
    }
    if (intervalLabel === Scope.HalfHourIntervals) {
        return zero ? undefined : {intervalLabel, mode: 'half-hour'};
    }
    if (intervalLabel === Scope.SecondIntervals) {
        return positive ? undefined : {intervalLabel, mode: zero ? 'zero-seconds' : 'legacy-seconds'};
    }
    if (fiveMinutes) return zero ? undefined : {intervalLabel, mode: 'positive-minutes'};
    if (!zero && !positive) return undefined;
    return {intervalLabel, mode: zero ? 'zero-minutes' : 'positive-minutes'};
}), {
    kind: 'alternatives',
    alternatives: clockProfileChoices,
    contextLabels: [Scope.MultiplesOf5]
});
