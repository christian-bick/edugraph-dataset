import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {TimeProblem} from '../../../../types/problems.ts';
import {TimeDigitalView, TimeDigitalViewId} from '../time-digital-view.tsx';
import {formatDigitalTime, formatTimeClue, validateDigitalTimeProblem} from './helpers.ts';

const payload = (
    viewId: TimeDigitalViewId,
    data: TimeProblem,
    isSolutionView: boolean
): ViewRenderPayload<TimeDigitalViewId> => ({
    problem: {type: 'time', data, labels: []}, viewId, labels: [], isSolutionView, seed: 9
});

describe('time-digital payload validation', () => {
    it('validates and formats aligned hour and half-hour payloads', () => {
        const hour = validateDigitalTimeProblem({
            secondsSinceMidnight: 8 * 3600,
            intervalSeconds: 3600,
            period: 'ante-meridiem'
        });
        const halfHour = validateDigitalTimeProblem({
            secondsSinceMidnight: 14 * 3600 + 30 * 60,
            intervalSeconds: 1800,
            period: 'post-meridiem'
        });
        expect(formatDigitalTime(hour)).toBe('8:00');
        expect(formatDigitalTime(halfHour)).toBe('2:30');
        expect(formatTimeClue(halfHour, 'post-meridiem')).toBe('half past two p.m.');
    });

    it.each([
        {secondsSinceMidnight: -1, intervalSeconds: 3600},
        {secondsSinceMidnight: 8 * 3600 + 15 * 60, intervalSeconds: 1800},
        {secondsSinceMidnight: 24 * 3600, intervalSeconds: 3600},
        {secondsSinceMidnight: 8 * 3600, intervalSeconds: 30},
        {secondsSinceMidnight: 14 * 3600 + 30 * 60, intervalSeconds: 1800, period: 'ante-meridiem'}
    ])('rejects malformed or misaligned payload %#', data => {
        expect(() => validateDigitalTimeProblem(data as TimeProblem)).toThrow();
    });
});

describe('time-digital direction modes', () => {
    const data: TimeProblem = {
        secondsSinceMidnight: 14 * 3600 + 30 * 60,
        intervalSeconds: 1800,
        period: 'post-meridiem'
    };

    it('keeps the clue and withholds display digits in construction Question Mode', () => {
        const question = renderToStaticMarkup(<TimeDigitalView mode="construction" viewId="time-digital-construction" payload={payload('time-digital-construction', data, false)} />);
        const solution = renderToStaticMarkup(<TimeDigitalView mode="construction" viewId="time-digital-construction" payload={payload('time-digital-construction', data, true)} />);
        expect(question).toContain('half past two p.m.');
        expect(question).not.toContain('Digital display: 2:30 p.m.');
        expect(solution).toContain('Digital display: 2:30 p.m.');
    });

    it('keeps the display and withholds the written response in reading Question Mode', () => {
        const question = renderToStaticMarkup(<TimeDigitalView mode="reading" viewId="time-digital" payload={payload('time-digital', data, false)} />);
        const solution = renderToStaticMarkup(<TimeDigitalView mode="reading" viewId="time-digital" payload={payload('time-digital', data, true)} />);
        expect(question).toContain('Digital display: 2:30 p.m.');
        expect(question).toContain('________________');
        expect(question).not.toContain('half past two');
        expect(solution).toContain('Written time response');
        expect(solution).toContain('2:30 p.m.');
    });
});
