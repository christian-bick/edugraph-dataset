import {describe, expect, it} from 'vitest';
import {formatTime, getClockAngles, getTickMarks} from './helpers.ts';

describe('time-analog helpers', () => {
    it('formats time correctly based on interval', () => {
        expect(formatTime(14 * 3600 + 5 * 60, 3600)).toBe('2:05');
        expect(formatTime(14 * 3600 + 5 * 60 + 30, 30)).toBe('2:05:30');
    });

    it('calculates clock hand angles correctly', () => {
        const angles = getClockAngles(3 * 3600);
        expect(angles.hourAngle).toBe(90);
        expect(angles.minuteAngle).toBe(0);
        expect(angles.secondAngle).toBe(0);

        const anglesHalfPast = getClockAngles(6 * 3600 + 30 * 60);
        expect(anglesHalfPast.hourAngle).toBe(195);
        expect(anglesHalfPast.minuteAngle).toBe(180);
    });

    it('generates 60 tick marks', () => {
        const marks = getTickMarks();
        expect(marks.length).toBe(60);
        expect(marks[0].isFive).toBe(true);
        expect(marks[1].isFive).toBe(false);
    });
});
