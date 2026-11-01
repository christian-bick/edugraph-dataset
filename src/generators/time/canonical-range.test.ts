import {describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import * as rng from '../../lib/random.ts';
import {CANONICAL_RANGE_THRESHOLDS, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {clockCaseAt, clockCaseCount, clockRangeProfiles} from './numeric-domain.ts';
import type {ClockProfile} from './clock-profile.ts';
import {TimeGenerator} from './generator.ts';
import {validateTimeProblem} from '../../visuals/views/time/time-presentation.ts';
import {formatTime} from '../../visuals/views/time/time-analog/helpers.ts';
import {formatDigitalTime} from '../../visuals/views/time/time-digital/helpers.ts';

const sources = [
    {clockProfile: {intervalLabel: Scope.HourIntervals, mode: 'whole-hour'}, seconds: 3600, minutes: [0], secondsValues: [0], retired: 0},
    {clockProfile: {intervalLabel: Scope.HalfHourIntervals, mode: 'half-hour'}, seconds: 1800, minutes: [30], secondsValues: [0], retired: 0},
    {clockProfile: {intervalLabel: Scope.MinuteIntervals, mode: 'zero-minutes'}, seconds: 60, minutes: [0], secondsValues: [0], retired: 0},
    {clockProfile: {intervalLabel: Scope.MinuteIntervals, mode: 'positive-minutes'}, seconds: 60,
        minutes: Array.from({length: 59}, (_, i) => i + 1), secondsValues: [0], retired: 4},
    {clockProfile: {intervalLabel: Scope.MinuteIntervals, mode: 'positive-minutes'}, seconds: 60,
        minutes: [5, 15, 25, 35, 45, 55], secondsValues: [0], five: true, retired: 2},
    {clockProfile: {intervalLabel: Scope.SecondIntervals, mode: 'legacy-seconds'}, seconds: 1,
        minutes: Array.from({length: 60}, (_, i) => i), secondsValues: Array.from({length: 60}, (_, i) => i), retired: 4},
    {clockProfile: {intervalLabel: Scope.SecondIntervals, mode: 'zero-seconds'}, seconds: 1,
        minutes: Array.from({length: 60}, (_, i) => i), secondsValues: [0], retired: 0}
] satisfies {clockProfile: ClockProfile; seconds: number; minutes: number[]; secondsValues: number[]; five?: boolean; retired: number}[];

describe('canonical clock component ranges', () => {
    it.each(sources)('retains the complete $clockProfile.mode / five=$five source except approved threshold singletons', source => {
        const expected = new Set<number>(), retired = new Set<number>();
        for (let hour = 0; hour < 24; hour++) for (const minute of source.minutes) for (const second of source.secondsValues) {
            const values = [hour % 12 || 12, minute, ...(source.seconds === 1 ? [second] : [])];
            const time = hour * 3600 + minute * 60 + second;
            if (new Set(values).size === 1 && CANONICAL_RANGE_THRESHOLDS.includes(values[0]! as never)) retired.add(time);
            else expected.add(time);
        }
        expect(retired.size).toBe(source.retired);
        const seen = new Set<number>(), draw = vi.spyOn(rng, 'random'), generator = new TimeGenerator();
        try {
            for (const {range} of clockRangeProfiles) {
                const config = {clockProfile: source.clockProfile, range, requireMultipleOf5: source.five ?? false,
                    isAnteMeridiem: false, isPostMeridiem: false};
                const count = clockCaseCount(config);
                expect(clockCaseCount({...config, isAnteMeridiem: true})).toBe(count / 2);
                expect(clockCaseCount({...config, isPostMeridiem: true})).toBe(count / 2);
                for (let index = 0; index < count; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / count);
                    const {data} = generator.generate(config)!;
                    const parts = validateTimeProblem('time-digital', data);
                    expect(hasCanonicalRangeWitness([parts.hour, parts.minute,
                        ...(parts.second === undefined ? [] : [parts.second])], range)).toBe(true);
                    expect(formatTime(data.secondsSinceMidnight, data.intervalSeconds)).toBe(formatDigitalTime(parts));
                    expect(seen.has(data.secondsSinceMidnight)).toBe(false);
                    seen.add(data.secondsSinceMidnight);
                    expect(draw).toHaveBeenCalledTimes(1);
                    if (index < count / 2) {
                        expect(clockCaseAt({...config, isAnteMeridiem: true}, index)).toBe(clockCaseAt(config, index));
                        expect(clockCaseAt({...config, isPostMeridiem: true}, index)).toBe(clockCaseAt(config, index + count / 2));
                    }
                }
            }
            expect(seen).toEqual(expected);
        } finally { draw.mockRestore(); }
    }, 30000);

    it('rejects malformed, infeasible and out-of-domain canonical requests before sampling', () => {
        const generator = new TimeGenerator();
        const config = {clockProfile: sources[0]!.clockProfile, range: clockRangeProfiles[0]!.range,
            requireMultipleOf5: false, isAnteMeridiem: false, isPostMeridiem: false};
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({...config, range: undefined})).toThrow();
            expect(() => generator.generate({...config, range: {min: 0, max: 5}} as never)).toThrow();
            expect(() => generator.generate({...config, range: clockRangeProfiles.at(-1)!.range})).toThrow();
            expect(clockCaseCount({...config, isAnteMeridiem: true, isPostMeridiem: true})).toBe(0);
            expect(clockCaseCount({...config, requireMultipleOf5: true})).toBe(0);
            for (const index of [-1, 0.5, clockCaseCount(config)]) expect(() => clockCaseAt(config, index)).toThrow();
            expect(() => clockCaseAt({...config, range: {...config.range, min: 20}}, 0)).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
