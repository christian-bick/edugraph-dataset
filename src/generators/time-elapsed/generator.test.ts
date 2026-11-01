import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../lib/random.ts';
import {TimeElapsedGenerator} from './generator.ts';

describe('TimeElapsedGenerator', () => {
    const generator = new TimeElapsedGenerator();

    it('proves invariant upper100 over all6500 original intervals and the required whole-hour split', () => {
        const draw = vi.spyOn(rng, 'random');
        let checked = 0;
        try {
            for (let hour = 1; hour <= 10; hour++) for (let startMinute = 31; startMinute <= 55; startMinute++) {
                for (let endMinute = 5; endMinute <= 30; endMinute++) {
                    draw.mockClear().mockReturnValueOnce((hour - 0.5) / 10)
                        .mockReturnValueOnce((startMinute - 30.5) / 25).mockReturnValueOnce((endMinute - 4.5) / 26);
                    const {data} = generator.generate({requireElapsedCount: true})!;
                    expect(data.startMinutesSinceMidnight).toBe(hour * 60 + startMinute);
                    expect(data.endMinutesSinceMidnight).toBe((hour + 1) * 60 + endMinute);
                    expect(data.elapsedMinutes).toBe(60 - startMinute + endMinute);
                    expect(hasCanonicalRangeWitness([hour, hour + 1, startMinute, endMinute,
                        0, data.minutesToNextHour, data.minutesAfterHour, data.elapsedMinutes], createCanonicalNumericRange(100))).toBe(true);
                    expect(draw).toHaveBeenCalledTimes(3);
                    checked++;
                }
            }
            expect(checked).toBe(6500);
        } finally { draw.mockRestore(); }
    });

    it('generates coherent intervals that cross an hour boundary', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({requireElapsedCount: true})!.data;
            const start = data.startMinutesSinceMidnight;
            const end = data.endMinutesSinceMidnight;

            expect(Number.isInteger(start)).toBe(true);
            expect(Number.isInteger(end)).toBe(true);
            expect(data.crossesHour).toBe(true);
            expect(Math.floor(end / 60)).toBe(Math.floor(start / 60) + 1);
            expect(data.minutesToNextHour).toBe(60 - start % 60);
            expect(data.minutesAfterHour).toBe(end % 60);
            expect(data.elapsedMinutes).toBe(end - start);
            expect(data.elapsedMinutes).toBe(
                data.minutesToNextHour + data.minutesAfterHour
            );
        }
    });

    it('is deterministic for the same seed', () => {
        setSeed('elapsed-time');
        const first = generator.generate({requireElapsedCount: true});
        setSeed('elapsed-time');
        expect(generator.generate({requireElapsedCount: true})).toEqual(first);
    });

    it('rejects targets without an explicit elapsed count', () => {
        expect(generator.generate({requireElapsedCount: false})).toBeNull();
        expect(() => generator.generate({})).toThrow();
    });
});
