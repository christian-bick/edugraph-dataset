import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {TimeElapsedGenerator} from './generator.ts';

const toMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
};

describe('TimeElapsedGenerator', () => {
    const generator = new TimeElapsedGenerator();

    it('generates coherent intervals that cross an hour boundary', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({requireElapsedCount: true})!.data;
            const start = toMinutes(data.startTime);
            const end = toMinutes(data.endTime);

            expect(data.startTime).toMatch(/^\d{2}:\d{2}$/);
            expect(data.endTime).toMatch(/^\d{2}:\d{2}$/);
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
