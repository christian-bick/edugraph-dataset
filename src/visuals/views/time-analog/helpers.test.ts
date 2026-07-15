import { describe, it, expect } from 'vitest';
import { formatTime, getClockAngles, getTickMarks } from './helpers.ts';

describe('time-analog helpers', () => {
    it('formats time correctly based on interval', () => {
        expect(formatTime('14:05:00', 3600)).toBe('2:05');
        expect(formatTime('14:05:30', 30)).toBe('2:05:30');
    });

    it('calculates clock hand angles correctly', () => {
        const angles = getClockAngles('03:00:00');
        expect(angles.hourAngle).toBe(90);
        expect(angles.minuteAngle).toBe(0);
        expect(angles.secondAngle).toBe(0);

        const anglesHalfPast = getClockAngles('06:30:00');
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
