import {describe, expect, it} from 'vitest';
import {formatDayPeriod, validateTimeProblem} from './time-presentation.ts';

describe('time presentation', () => {
    it('resolves a typed instant and period', () => {
        expect(validateTimeProblem('time-digital', {
            secondsSinceMidnight: 14 * 3600 + 30 * 60,
            intervalSeconds: 1800,
            period: 'post-meridiem'
        })).toEqual({hour24: 14, hour: 2, minute: 30});
        expect(formatDayPeriod('post-meridiem')).toBe('p.m.');
    });

    it.each([
        {secondsSinceMidnight: -1, intervalSeconds: 1},
        {secondsSinceMidnight: 24 * 3600, intervalSeconds: 3600},
        {secondsSinceMidnight: 8 * 3600 + 15 * 60, intervalSeconds: 1800},
        {secondsSinceMidnight: 14 * 3600, intervalSeconds: 3600, period: 'ante-meridiem'}
    ])('rejects an invalid typed instant %#', data => {
        expect(() => validateTimeProblem('time-digital', data as never)).toThrow();
    });
});
